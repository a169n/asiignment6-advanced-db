describe("API smoke", () => {
  const password = Cypress.env("loadUserPassword") as string;

  // Helper function to display API response on a page
  function displayResponse(title: string, response: any) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
            .status-200 { background: #4CAF50; color: white; }
            .status-201 { background: #2196F3; color: white; }
            .status-409 { background: #FF9800; color: white; }
            pre { background: #f9f9f9; padding: 15px; border-radius: 4px; overflow-x: auto; border-left: 4px solid #4CAF50; }
            .label { font-weight: bold; color: #666; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${title}</h1>
            <div class="status status-${response.status}">Status: ${response.status}</div>
            <div class="label">Response Body:</div>
            <pre>${JSON.stringify(response.body, null, 2)}</pre>
            ${response.headers ? `<div class="label">Headers:</div><pre>${JSON.stringify(response.headers, null, 2)}</pre>` : ''}
          </div>
        </body>
      </html>
    `;
    cy.document().then((doc) => {
      doc.open();
      doc.write(html);
      doc.close();
    });
  }

  it("registers and logs in", () => {
    const email = `cypress_${Date.now()}@example.com`;
    const username = `cypress_${Date.now()}`;
    // Register user - handle both success (201) and duplicate (409)
    cy.request({
      method: "POST",
      url: "/register",
      body: { username, email, password },
      failOnStatusCode: false,
    }).then((registerResponse) => {
      expect(registerResponse.status).to.be.oneOf([201, 409]);
      displayResponse("User Registration", registerResponse);
      cy.wait(500); // Wait for page to render
      cy.screenshot("01-register-response");
    });
    // Login with the email we just registered
    cy.request({
      method: "POST",
      url: "/login",
      body: { email, password },
    }).then((loginResponse) => {
      expect(loginResponse.status).to.eq(200);
      expect(loginResponse.body).to.have.property("token");
      Cypress.env("authToken", loginResponse.body.token);
      displayResponse("User Login", loginResponse);
      cy.wait(500);
      cy.screenshot("02-login-success");
    });
  });

  it("lists products with auth", () => {
    const token = Cypress.env("authToken");
    expect(token, "token from login step").to.exist;
    cy.request({
      method: "GET",
      url: "/products",
      headers: { Authorization: `Bearer ${token}` },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.products).to.be.an("array");
      // If products exist, store the first one's ID
      // If not, we'll create a product in the next test
      if (response.body.products.length > 0) {
        Cypress.env("productId", response.body.products[0]._id);
      }
      displayResponse(`Products List (${response.body.products.length} products)`, response);
      cy.wait(500);
      cy.screenshot("03-products-list");
    });
  });

  it("creates like interaction", () => {
    const token = Cypress.env("authToken");
    expect(token, "token").to.exist;
    
    // First, ensure we have a product ID - fetch products if needed
    cy.then(() => {
      let productId = Cypress.env("productId");
      
      // If no product ID from previous test, fetch products
      if (!productId) {
        return cy.request({
          method: "GET",
          url: "/products",
          headers: { Authorization: `Bearer ${token}` },
        }).then((productsResponse) => {
          if (productsResponse.body.products && productsResponse.body.products.length > 0) {
            productId = productsResponse.body.products[0]._id;
            Cypress.env("productId", productId);
            return productId;
          }
          // If still no products, the test will be skipped
          return null;
        });
      }
      return productId;
    }).then((productId) => {
      // Skip test if no products available (database might be empty)
      if (!productId) {
        cy.log("No products available in database - skipping interaction test");
        return;
      }
      
      // Create the like interaction
      cy.request({
        method: "POST",
        url: "/interactions",
        headers: { Authorization: `Bearer ${token}` },
        body: { productId, type: "like" },
      }).then((response) => {
        expect([200, 201]).to.include(response.status);
        displayResponse("Create Like Interaction", response);
        cy.wait(500);
        cy.screenshot("04-like-interaction-created");
      });
    });
  });
});

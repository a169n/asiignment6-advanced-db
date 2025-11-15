describe("API smoke", () => {
  const password = Cypress.env("loadUserPassword") as string;

  it("registers and logs in", () => {
    const email = `cypress_${Date.now()}@example.com`;
    cy.request("POST", "/register", { username: "cypress", email, password }).then((response) => {
      expect(response.status).to.be.oneOf([201, 409]);
    });
    cy.request("POST", "/login", { email, password }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("token");
      Cypress.env("authToken", response.body.token);
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
      if (response.body.products.length) {
        Cypress.env("productId", response.body.products[0]._id);
      }
    });
  });

  it("creates like interaction", () => {
    const token = Cypress.env("authToken");
    const productId = Cypress.env("productId");
    expect(token, "token").to.exist;
    expect(productId, "product id").to.exist;
    cy.request({
      method: "POST",
      url: "/interactions",
      headers: { Authorization: `Bearer ${token}` },
      body: { productId, type: "like" },
    }).then((response) => {
      expect([200, 201]).to.include(response.status);
    });
  });
});

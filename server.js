const express = require("express");
const cors = require("cors");
const { getProducts } = require("./scrapper");

class Server {
  constructor() {
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    this.setUpRoutes();
  }

  async controller(req, res) {
    const { searchString } = req.params;
    const products = await getProducts(searchString);
    res.json(products);
  }

  setUpRoutes() {
    this.app.get("/api/:searchString", this.controller.bind(this));
  }

  start() {
    this.app.listen(3001, () => {
      console.log("Server listening on port 3001");
    });
  }
}

module.exports = Server;

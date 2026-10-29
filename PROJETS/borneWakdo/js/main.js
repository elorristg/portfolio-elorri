let cart = [];
let currentSelectedMenu = null;
let currentSelectedSize = "Best Of";
let currentSelectedSide = "Frites";
let currentSelectedDrink = "Coca Cola";
let sizePriceModifier = 0;
let currentCustomDrink = null;
let currentCustomDrinkSize = "30cl";
let currentCustomDrinkQuantity = 1;
let drinkSizePriceModifier = 0;
let typeDeCommande = "";
let allProducts = {};
let currentSingleProduct = null;
let currentSingleProductQuantity = 1;

document.addEventListener("DOMContentLoaded", () => {
  chargerCategories();
  chargerProduits();
  initialiserEvenementsFixes();
});

function chargerCategories() {
  const conteneur = document.getElementById("categories-container");
  if (!conteneur) return;
  conteneur.innerHTML = "";

  fetch("./categories.json")
    .then((res) => res.json())
    .then((categories) => {
      categories.forEach((cat) => {
        const titreMajuscule =
          cat.title.charAt(0).toUpperCase() + cat.title.slice(1);
        const pathImg = cat.image.startsWith("/")
          ? cat.image.substring(1)
          : cat.image;

        const div = document.createElement("div");
        div.className = "food-menus";
        div.innerHTML = `
          <img src="./img/${pathImg}" alt="${titreMajuscule}" style="pointer-events: none;" />
          <p style="pointer-events: none;">${titreMajuscule}</p>
        `;

        div.addEventListener("click", () => {
          document
            .querySelectorAll(".food-menus")
            .forEach((el) => el.classList.remove("active"));
          div.classList.add("active");
          afficherProduits(cat.title);
        });

        conteneur.appendChild(div);
      });
    })
    .catch((err) => console.error("Erreur JSON catégories:", err));
}

function chargerProduits() {
  fetch("./produits.json")
    .then((res) => res.json())
    .then((data) => {
      allProducts = data;
      afficherProduits("menus");
      afficherBoissons(data.boissons);
    })
    .catch((err) => console.error("Erreur JSON produits:", err));
}

function afficherBoissons(listeBoissons) {
  const container = document.getElementById("drinks-container");
  if (!container) return;
  container.innerHTML = "";
  listeBoissons.forEach((boisson) => {
    const pathImg = boisson.image.startsWith("/")
      ? boisson.image.substring(1)
      : boisson.image;

    const card = document.createElement("div");
    card.className = "drink-card option-card";
    card.setAttribute("data-choice", boisson.nom);
    card.innerHTML = `
      <img src="./img/${pathImg}" alt="Verre de ${boisson.nom}" />
      <p class="label">${boisson.nom}</p>
    `;
    container.appendChild(card);
  });

  gererChoixOptions(
    ".drinks-options .drink-card",
    "data-choice",
    (val) => (currentSelectedDrink = val),
  );
}

function afficherProduits(nomCategorie) {
  const conteneur = document.getElementById("products-container");
  const titreDiv = document.getElementById("category-title");
  if (!conteneur) return;

  conteneur.innerHTML = "";
  const cle = nomCategorie.toLowerCase();
  const titreMajuscule = cle.charAt(0).toUpperCase() + cle.slice(1);
  if (titreDiv) titreDiv.innerText = "Nos " + titreMajuscule;

  const produits = allProducts[cle];

  if (produits && produits.length > 0) {
    produits.forEach((produit) => {
      const pathImg = produit.image.startsWith("/")
        ? produit.image.substring(1)
        : produit.image;

      const div = document.createElement("div");
      div.className = "sandwitch-card";
      div.innerHTML = `
        <img src="./img/${pathImg}" alt="${produit.nom}" />
        <div class="card-info">
          <p class="product-name">${produit.nom}</p>
          <p class="product-price">${produit.prix.toFixed(2)}€</p>
        </div>
      `;

      div.addEventListener("click", () =>
        ouvrirTunnelAchat(cle, produit.nom, produit.prix),
      );
      conteneur.appendChild(div);
    });
  } else {
    conteneur.innerHTML = `<h3 style="padding: 2rem;">Bientôt disponible...</h3>`;
  }
}

function ouvrirTunnelAchat(categorie, nomProduit, prixProduit) {
  if (categorie === "menus") {
    currentSelectedMenu = { name: nomProduit, basePrice: prixProduit };
    sizePriceModifier = 0;
    resetModalSelection(".size-options", "Best Of", "data-size");
    document.getElementById("modal-taille-menu").style.display = "flex";
  } else if (categorie === "boissons") {
    currentCustomDrink = { name: nomProduit, price: prixProduit };
    currentCustomDrinkQuantity = 1;
    drinkSizePriceModifier = 0;
    document.getElementById("drink-quantity-value").innerText = "1";
    resetModalSelection(".drink-size-options", "30cl", "data-drink-size");
    document.getElementById("modal-custom-drink").style.display = "flex";
  } else {
    currentSingleProduct = { name: nomProduit, price: prixProduit };
    currentSingleProductQuantity = 1;
    document.getElementById("nom-produit-quantite").innerText = nomProduit;
    document.getElementById("produit-seul-quantity-value").innerText = "1";
    document.getElementById("modal-produit-seul").style.display = "flex";
  }
}

function resetModalSelection(containerSelector, defaultValue, dataAttribute) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const cards = container.querySelectorAll(".option-card, .drink-card");
  cards.forEach((c) => {
    c.classList.remove("active");
    if (c.getAttribute(dataAttribute) === defaultValue)
      c.classList.add("active");
  });
}

function gererChoixOptions(
  selector,
  attribute,
  callbackValue,
  callbackModifier,
) {
  document.querySelectorAll(selector).forEach((card) => {
    card.addEventListener("click", function () {
      document
        .querySelectorAll(selector)
        .forEach((c) => c.classList.remove("active"));
      this.classList.add("active");
      callbackValue(this.getAttribute(attribute));
      if (callbackModifier)
        callbackModifier(parseFloat(this.getAttribute("data-price-modifier")));
    });
  });
}

function initialiserEvenementsFixes() {
  initialiserNavigationEtInterface();
  initialiserModaleMenu();
  initialiserModaleBoissonEtSeul();
  initialiserPaiement();
}

// 1. NAVIGATION ET INTERFACE GLOBALE
function initialiserNavigationEtInterface() {
  // Sur place / A emporter
  document.querySelectorAll(".choice-card").forEach((btn) => {
    btn.addEventListener("click", function () {
      typeDeCommande = this.querySelector(".label").innerText;
      document.getElementById("order-type-display").innerText =
        typeDeCommande + " : 326";
      document.getElementById("screen-welcome").classList.remove("active");
      document.getElementById("screen-choose-menus").classList.add("active");
    });
  });

  // Fermer les modales
  document.querySelectorAll(".close-modal-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      this.closest(".modal-overlay").style.display = "none";
    });
  });

  // Menu Hamburger mobile
  const btnHamburger = document.getElementById("hamburger-menu");
  const catContainer = document.getElementById("categories-container");
  if (btnHamburger && catContainer) {
    btnHamburger.onclick = () =>
      catContainer.classList.toggle("show-mobile-menu");
    catContainer.addEventListener("click", (e) => {
      if (e.target.closest(".food-menus"))
        catContainer.classList.remove("show-mobile-menu");
    });
  }

  // Flèches
  const arrowLeftCat = document.querySelector(".select-food .arrow-left");
  const arrowRightCat = document.querySelector(".select-food .arrow-right");
  if (arrowRightCat && catContainer)
    arrowRightCat.onclick = () =>
      catContainer.scrollBy({ left: 200, behavior: "smooth" });
  if (arrowLeftCat && catContainer)
    arrowLeftCat.onclick = () =>
      catContainer.scrollBy({ left: -200, behavior: "smooth" });

  const containerBoissons = document.getElementById("drinks-container");
  const btnLeftBoisson = document.getElementById("arrow-left-boisson");
  const btnRightBoisson = document.getElementById("arrow-right-boisson");
  if (btnRightBoisson && containerBoissons)
    btnRightBoisson.onclick = () =>
      containerBoissons.scrollBy({ left: 220, behavior: "smooth" });
  if (btnLeftBoisson && containerBoissons)
    btnLeftBoisson.onclick = () =>
      containerBoissons.scrollBy({ left: -220, behavior: "smooth" });
}

// 2. PARCOURS DE CRÉATION D'UN MENU
function initialiserModaleMenu() {
  // Taille
  gererChoixOptions(
    ".size-options .option-card",
    "data-size",
    (val) => (currentSelectedSize = val),
    (mod) => (sizePriceModifier = mod),
  );
  document
    .getElementById("btn-taille-suivant")
    .addEventListener("click", () => {
      document.getElementById("modal-taille-menu").style.display = "none";
      document.getElementById("modal-accompagnement").style.display = "flex";
    });

  // Accompagnement
  gererChoixOptions(
    "#modal-accompagnement .option-card",
    "data-choice",
    (val) => (currentSelectedSide = val),
  );
  document.getElementById("btn-next-step").addEventListener("click", () => {
    document.getElementById("modal-accompagnement").style.display = "none";
    document.getElementById("modal-boisson").style.display = "flex";
  });
  const btnRetourAccomp = document.getElementById("btn-retour-accomp");
  if (btnRetourAccomp) {
    btnRetourAccomp.addEventListener("click", () => {
      document.getElementById("modal-accompagnement").style.display = "none";
      document.getElementById("modal-taille-menu").style.display = "flex";
    });
  }

  // Boisson du menu et validation finale
  document
    .getElementById("btn-ajouter-commande")
    .addEventListener("click", () => {
      document.getElementById("modal-boisson").style.display = "none";
      let finalPrice = currentSelectedMenu.basePrice + sizePriceModifier;
      addToCart(
        `Menu ${currentSelectedSize} ${currentSelectedMenu.name}`,
        finalPrice,
        currentSelectedSide,
        currentSelectedDrink,
      );
    });
  const btnRetourBoisson = document.getElementById("btn-retour-boisson");
  if (btnRetourBoisson) {
    btnRetourBoisson.addEventListener("click", () => {
      document.getElementById("modal-boisson").style.display = "none";
      document.getElementById("modal-accompagnement").style.display = "flex";
    });
  }
}

// 3. BOISSONS SUR MESURE ET PRODUITS SEULS
function initialiserModaleBoissonEtSeul() {
  // Boissons personnalisées
  gererChoixOptions(
    ".drink-size-options .option-card",
    "data-drink-size",
    (val) => (currentCustomDrinkSize = val),
    (mod) => (drinkSizePriceModifier = mod),
  );

  document
    .getElementById("btn-qty-plus")
    .addEventListener(
      "click",
      () =>
        (document.getElementById("drink-quantity-value").innerText =
          ++currentCustomDrinkQuantity),
    );
  document.getElementById("btn-qty-minus").addEventListener("click", () => {
    if (currentCustomDrinkQuantity > 1)
      document.getElementById("drink-quantity-value").innerText =
        --currentCustomDrinkQuantity;
  });

  document
    .getElementById("btn-confirm-add-drink")
    .addEventListener("click", () => {
      document.getElementById("modal-custom-drink").style.display = "none";
      let singlePrice = currentCustomDrink.price + drinkSizePriceModifier;
      for (let i = 0; i < currentCustomDrinkQuantity; i++) {
        addToCart(
          `${currentCustomDrink.name} (${currentCustomDrinkSize})`,
          singlePrice,
          "",
          "",
        );
      }
    });

  document
    .getElementById("btn-cancel-drink")
    .addEventListener(
      "click",
      () =>
        (document.getElementById("modal-custom-drink").style.display = "none"),
    );
  document
    .getElementById("btn-close-custom-drink")
    .addEventListener(
      "click",
      () =>
        (document.getElementById("modal-custom-drink").style.display = "none"),
    );

  // Produits seuls (Burgers, frites seules, etc.)
  const btnPlusSeul = document.getElementById("btn-qty-plus-seul");
  if (btnPlusSeul)
    btnPlusSeul.addEventListener("click", () => {
      currentSingleProductQuantity++;
      document.getElementById("produit-seul-quantity-value").innerText =
        currentSingleProductQuantity;
    });

  const btnMinusSeul = document.getElementById("btn-qty-minus-seul");
  if (btnMinusSeul)
    btnMinusSeul.addEventListener("click", () => {
      if (currentSingleProductQuantity > 1) {
        currentSingleProductQuantity--;
        document.getElementById("produit-seul-quantity-value").innerText =
          currentSingleProductQuantity;
      }
    });

  const btnAddSeul = document.getElementById("btn-confirm-add-seul");
  if (btnAddSeul)
    btnAddSeul.addEventListener("click", () => {
      document.getElementById("modal-produit-seul").style.display = "none";
      for (let i = 0; i < currentSingleProductQuantity; i++) {
        addToCart(
          currentSingleProduct.name,
          currentSingleProduct.price,
          "",
          "",
        );
      }
    });
}

// 4. SYSTÈME DE PAIEMENT ET FIN DE COMMANDE
function initialiserPaiement() {
  const btnPayer = document.querySelector(".btn-payer");
  if (btnPayer) {
    btnPayer.addEventListener("click", () => {
      if (cart.length === 0) {
        alert("Votre panier est vide. Veuillez ajouter des produits.");
        return;
      }
      document.getElementById("screen-choose-menus").classList.remove("active");
      document.getElementById("number-order").classList.add("active");
    });
  }

  const btnAbandon = document.querySelector(".btn-abandon");
  if (btnAbandon) {
    btnAbandon.addEventListener("click", () => {
      if (confirm("Voulez-vous vraiment annuler votre commande ?")) {
        cart = [];
        updateCartUI();
        document
          .getElementById("screen-choose-menus")
          .classList.remove("active");
        document.getElementById("screen-welcome").classList.add("active");
      }
    });
  }

  const btnSaveNumber = document.querySelector(".btn-save-number");
  if (btnSaveNumber) {
    btnSaveNumber.onclick = () => {
      const commandeJSON = JSON.stringify(cart);

      fetch("https://api-fictive.wacdo.fr/envoyer-commande", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: commandeJSON,
      })
        .then((response) => {
          console.log("Commande envoyée à l'API fictive !", commandeJSON);
        })
        .catch((error) => {
          console.error("Erreur attendue (API fictive) :", error);
        });

      document.getElementById("number-order").classList.remove("active");
      document.getElementById("screen-thanks").classList.add("active");
    };
  }

  const btnNouvelleCommande = document.getElementById("btn-nouvelle-commande");
  if (btnNouvelleCommande) {
    btnNouvelleCommande.addEventListener("click", () => {
      cart = [];
      updateCartUI();
      document.getElementById("screen-thanks").classList.remove("active");
      document.getElementById("screen-welcome").classList.add("active");
    });
  }
}

function addToCart(name, price, side, drink) {
  cart.push({ name, price, side, drink });
  updateCartUI();
}

window.removeFromCart = function (index) {
  cart.splice(index, 1);
  updateCartUI();
};

function updateCartUI() {
  const containers = document.querySelectorAll(".order-items");
  const totalElements = document.querySelectorAll(".total-price");
  let totalPrice = 0;
  let itemsHTML = "";

  cart.forEach((item, index) => {
    totalPrice += item.price;
    let detailsHTML = "";
    if (item.side || item.drink) {
      detailsHTML = `<ul class="item-details">
        ${item.side ? `<li>${item.side}</li>` : ""}
        ${item.drink ? `<li>${item.drink}</li>` : ""}
      </ul>`;
    }
    itemsHTML += `
      <div class="order-item">
        <div class="item-header">
          <strong>1 ${item.name}</strong>
          <img src="./img/images/trash.png" alt="Supprimer" class="trash-icon" onclick="removeFromCart(${index})" style="cursor:pointer;" />
        </div>
        ${detailsHTML}
      </div>`;
  });

  containers.forEach((c) => (c.innerHTML = itemsHTML));
  totalElements.forEach(
    (e) => (e.innerText = totalPrice.toFixed(2).replace(".", ",") + "€"),
  );
}

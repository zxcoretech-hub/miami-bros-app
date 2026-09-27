const menuItems = [
  {
    id: 1,
    title: "Bro Clásico 4 Piezas",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1Vhmfju0tVYft2mnig_mFfJ0iaql4jSG_-VbVGw-hPE2RRkgwZ5uWwOF8atxrKDhji3MJAMEY0a1WYIh98s37NuqvhjXfiI9nBFE1eC-GH1KXcRmXXuU9b1cNZurngfLK4GqaiC0NKq3o9l3iPZJt6Zy-5Ne-lqOx8SxuCVDK_OVUIgcJGeV5kMljeZDjUAdz-9loQVaL5YF6g1W6GqSj8TBw6NdqcI5B1F2-jcHdePXA-1TP_PEOWhQu8b",
    badge: "MÁS VENDIDO",
    badgeClass: "bg-secondary-container text-on-secondary-container",
    description:
      "4 presas extra crujientes sobre papel parafinado oficial con sazón secreta, ensalada de col fresca y dip.",
    priceStr: "$6.50 USD",
    price: 6.5,
    waMessage: "Hola quiero pedir Bro Clasico 4 Piezas en Panama",
  },
  {
    id: 2,
    title: "The Luigi Green Tender Box",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1UoZ8ruarrXZnYMZlFg__wVwK8JlpbdQvS2qkD3f7XMBbgUPg-Ndi_6kjFVisIyRwMWinT7_CKatk2a6chyxyF0t5PN1F59H-BsouO39i73k8t4nHh43H_BDOZ324l_UKOI3o_Ln4_rcoJN8TkNeE400njGp7utOo3CyeP8wUxixojiVcriRaSBxVvGE4FxtnONqv3Lrw1zc69RIId60D5dnA8-pXbQlH0gfRIorDIT6nQNAzVMVgS7W8nQ",
    badge: "FAVORITO BRO'S",
    badgeClass: "bg-primary text-on-primary",
    description:
      "6 tenders gigantes de suprema de pollo apanado crujiente con papas waffle sazonadas y salsa ranch verde de la casa.",
    priceStr: "$7.50 USD",
    price: 7.5,
    waMessage: "Hola quiero pedir The Luigi Green Tender Box en Panama",
  },
  {
    id: 3,
    title: "The Mario Red Spicy Burger",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1X2UyxbNycYSqceR0T0YPWuDrb1z49MohveFl4X2suFI93a_sdDBXBAoGGaRhPzspuc2ihcxXMJpBllJ4L8PuCrtMCoy0ShHHNGrSt8ULPpagc-R_tQxxd1VyxZqPHdC8baw7-DAVRpdUhUmZ3dizK3t1hQ1cFXg7bD7aSzVBtRD3iWGIYhdZvfHxsuaNctpnGueD-Jhy2ZgNyrU5yzmv8GXx8-23Ep_YDO0u4zUAg8xfUF7Ywe_qRDNjE",
    badge: "HOT & SPICY",
    badgeClass: "bg-primary-container text-on-primary",
    description:
      "Hamburguesa colosal doble pechuga frita con queso cheddar fundido, pepinillos dulces encurtidos y salsa picante especial.",
    priceStr: "$8.50 USD",
    price: 8.5,
    waMessage: "Hola quiero pedir The Mario Red Spicy Burger en Panama",
  },
  {
    id: 4,
    title: "Chicharrón Bro's Tradicional",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1UfHgabYa1vxMvmLIQTQegQFGWEZCdFFQkr49SxLUVCc4_m90dSNRY8hywoHp7-Ew2IsTbdhhbUEzBpkoUNDPMivUkpAk3InLhbMLdYk7EKYpRtN5lCy3ndT0DhWdzb8cKAI6U54b6Se210XXheF_XgHLyiz9Ii-ALDkZ5orLDnUfs9flOIuNNYLfuJqzBDyze5WUxr1D8wRtVd68Dbhl9LsZmZOHtEbqRu0K559ucdKCFdXTOya0w1ZKgS",
    badge: "🇨🇴 SAZÓN COLOMBIANO",
    badgeClass: "bg-secondary-container text-on-secondary-container",
    description:
      "Crujiente chicharrón con piel tostada y carnosa, patacones dorados de plátano verde recién hechos, limón y cremoso guacamole.",
    priceStr: "$8.99 USD",
    price: 8.99,
    waMessage: "Hola quiero pedir Chicharron con Patacones en Panama",
  },
  {
    id: 5,
    title: "Super Mega Bucket 16 Piezas",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1XoQidWjtCDOoXdzaecNU2oGcJVCAsvex5BteAP-88o58BpO9cSnd-k5LHKd1ZMIyXzTBTsLsEMIuQoII4gMM3fZwKlbGYKIk1WvDx8foqCBG1zh9X7Pb6wPC9C4g6iHOwp4Tho35Wi1Rk9qXnOd0gZxdS6HZchs_5yjYWc-YzU6FUqq2eMBx3jgqKincNhhHRs5FMq-maI5Y8nBdjPwzoeRB15k1PoLnxKb4YjkS597glH7EsAbEur3Qsv",
    badge: "PARA COMPARTIR",
    badgeClass: "bg-primary text-on-primary",
    description:
      "Balde oficial Miami Bro's con 16 piezas surtidas doradas, papas fritas familiares crocantes y selección de salsas de autor.",
    priceStr: "$19.99 USD",
    price: 19.99,
    waMessage: "Hola quiero pedir Mega Bucket en Panama",
  },
  {
    id: 6,
    title: "Bro's Crispy Wings (12 pcs)",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1W5pBXL8YJSy9yimGcm2BGGKdE-4MdtbPmnFf2SzcjBSqNJFjoF9kuhoX1-k3DeIN4Fk3znqQD1zCYU2WqX8So-IlVEyLgPxihwTZ8lP-ayh_2It2Nxmcl_jEX85aLWZDWvTInhTY8cAmKGExtem262fZisywuWlPusOoH6ox_0DdxwFwLULu_tOEYr9O3v1-DkTxuvqWsjJWl6QBzR5kK0tJXFOukxqoFjknvh3HyTRJOrRShh5IH7Vtg",
    badge: "CRUJIENTE EXTREMO",
    badgeClass: "bg-secondary-container text-on-secondary-container",
    description:
      "12 alitas crocantes con papas onduladas sazonadas, apio fresco y salsas buffalo y ranch.",
    priceStr: "$8.50 USD",
    price: 8.5,
    waMessage: "Hola quiero pedir Crispy Wings en Panama",
  },
  {
    id: 7,
    title: "Popcorn Chicken Bro's",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1UnpaAD6NR6Fr1yaQq9KGfHZRxLHaV7DaB21gKWQxXwl0mjtRSHsuFhyAPfit7slJOUQYmjvWPPBTeRwNlOtzfxr3UanxKDqmfZht3m0doAHH_X5aBthpi8FKCvn3GnmzmgkGqMnCnFiDPqRK-iynDcRjYX93D_kO7ExqXRsgP2GwzctCt68zGA4tDSTlts9o8qxP7BhUQSsZjTZVE685W1sKcCGmy7PZOxN-5KiwCYivbhUkh7cnjzmBtc",
    badge: "CRUJIENTE EXTRA",
    badgeClass: "bg-primary text-on-primary",
    description:
      "Bocados crocantes de pechuga servidos en canastilla oficial con salsa y receta tradicional.",
    priceStr: "$5.99 USD",
    price: 5.99,
    waMessage: "Hola quiero pedir Popcorn Chicken en Panama",
  },
  {
    id: 8,
    title: "Bro's Crispy Chicken Wrap",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDkzqjUI6tzDT5XS_yxmt3tvtFlQgsD1YszayHUn_v7q0_YSvb01mNNMqrnKojyC4SNiHnuPR2qEBDEv7IfuZGM_H5ABNZSYDFQS8_sBLDDkom6o84jKq_reKeDoAdsl5jlKvqmLwd7TCUKMCLAaMvwrRRBNkdNvZZtwgPGM1FEJbMm7Zh0kRt5aum8eHAPUrnCxepL-VmlV9vNUlIOQXu8inHXKfvwrbmS55AACosYyo_256weQVlPFw",
    badge: "NUEVO",
    badgeClass: "bg-amber-400 text-on-secondary-container",
    description:
      "Tortilla artesanal rellena de jugosas tiras de pechuga extra crujiente, queso fundido, lechuga fresca y salsa de la casa, acompañada de papas fritas doradas servidas en canastilla sobre papel oficial Miami Bro's.",
    priceStr: "$7.99 USD",
    price: 7.99,
    waMessage: "Hola quiero pedir Bros Crispy Chicken Wrap en Panama",
  },
];

// Initialize global app data object
window.MiamiBros = {
  menuItems: menuItems,
};

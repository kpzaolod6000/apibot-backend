const agenteTransition = (response) => {
  console.log("Connectiing Agente...");

  const propertiesTransfer = {
    transferType: "livechat",
    transferTo: "",
  };

  response.transfer.status = true;
  response.transfer.properties = propertiesTransfer;
};

module.exports = agenteTransition;

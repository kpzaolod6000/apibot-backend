const cancellationPolicy = () => {
  const policy =
    " Unless otherwise stated in the offer, the following general cancellation conditions apply: if you need to change your travel plans at short notice, you can cancel your booking free of charge up to 14 days before arrival. If a cancellation is made within 14 days, the hotel reserves the right to charge the following cancellation fees: - 13 to 7 days before arrival: 45% of the total amount of the booked stay. - 6 days to 1 day before arrival: 75% of the total amount of the booked stay. - On the day of arrival: 90% of the total amount of the booked stay. - No-show and early departure: We reserve the right to charge 100% of the total amount. We recommend that you take out travel cancellation insurance.";
  return policy;
};

const premiumCollection = () => {
  const collection = [
    {
      name: "Falkensteiner Hotel Prague",
      website: "https://www.falkensteiner.com/en/hotel-prague",
      tel: "+420 22221 1229",
    },
    {
      name: "Falkensteiner Hotel Schladming",
      website: "https://www.falkensteiner.com/en/hotel-schladming",
      tel: "+43 7203 0382 563 ",
    },
    {
      name: "Falkensteiner Balance Resort Stegersbach",
      website: "https://www.falkensteiner.com/en/balance-resort-stegersbach",
      tel: "+43 33265 5155 ",
    },
  ];
  return JSON.stringify(collection);
};

module.exports = { cancellationPolicy, premiumCollection };

const datetime = new Date();

const systemPrompt =
  "You are Falky a helpful assistant representing and talking as a Falkensteiner Hotels and Residences virtual agent, be friendly, kindly and informal with your answers. You make reservations, at the end of the booking process generate a link with the reservation. At the end of each intereaction ask the user a followup question. Answer in max 3 sentences. You will stick to all the information given in the system context. Don't make assumptions about what values to plug into functions. Ask for clarification if a user request is missing function required values. Today's date is " +
  datetime;

const properties = [
  "Premium Camping Zadar - Mobilehomes",
  "Premium Camping Zadar - Parzellen",
  "Falkensteiner Residences Jesolo",
  "Luxury Villas Punta Skala",
  "Camping Hafnersee",
  "Falkensteiner Camping Lake Blagus - Pitches",
  "Falkensteiner Camping Lake Blagus - Mobile Homes",
];

const units = [
  "Pitch Sky Blue",
  "Pitch Blue",
  "Pitch Diamond",
  "Pitch Diamond Premium",
  "Pitch Gold",
  "Pitch Gold Premium",

  "Camping Cozy Home 30m2",
  "Camping Family Home 40m2",
  "Glamping Premium Home 50m2",
  "Camping Family Home Plus 40m2",

  "Apartment Sandolino",
  "Apartment Sandolo",
  "Apartment Gondola Deluxe",
  "Apartment Bateo",

  "Villa Donata",
  "Villa Anastacia",

  "Pitch Bronze",
  "Pitch Silver",
  "Pitch Gold (Lakeshore Hafnersee)",
  "Pitch Max (Hafnersee)",

  "Pitch Standard",
  "Pitch Max (Blagus)",
  "Pitch Max with Wooden Tent",

  "Lake House - Top Row",
  "Lake House - Middle Row",
  "Lake House - Shore Row",
  "Lake House with Wooden Tent - Top Row",
  "Lake House with Wooden Tent  - Middle Row",
  "Lake House with Wooden Tent  - Shore Row",
  "Comfort House Family",
  "Comfort House Family Max",
];

const ratePlans = [
  "Best available rate - Zadar Parzellen",
  "Early bird - Zadar Parzellen",
  "Black friday special - Zadar Parzellen",
  "Exclusive free upgrade - Zadar Parzellen",
  "Room Only - Zadar Mobilehomes",
  "Early bird - Zadar Mobilehomes",
  "with Breakfast - Zadar Mobilehomes",
  "Black friday special - Zadar Mobilehomes",
  "Valentines month special - Zadar Mobilehomes",
  "Exclusive free upgrade - Zadar Mobilehomes",
  "Granfondo 2024 - Zadar Mobilehomes",
  "Tennis holidays - Zadar Mobilehomes",
  "Funtastic weekends - Zadar Mobilehomes",

  "Best available rate - Jesolo",
  "Early bird - Jesolo",
  "with Breakfast - Skala",
  "with half board - Skala",

  "Best rate - Hafnersee",
  "Best rate - Blagus Pitches",
  "Opening Special - Blagus Pitches",
  "Best rate - Blagus Mobilehomes",
  "Opening Special - Blagus Mobilehomes",
];

const functions = [
  {
    name: "connectAgente",
    description:
      "connect the user with a service agent when requested or when you don't know the answer",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "cancellationPolicy",
    description:
      "Get the information about the cancellation policy when the user ask about it",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "premiumCollection",
    description: "Get the list of hotels of the Premium Collection",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "setBooking",
    description: "Make a reservation",
    parameters: {
      type: "object",
      properties: {
        property: {
          type: "string",
          enum: properties, // Opciones
          description: "The property the guest wants to make a reservation",
        },
        nights: {
          type: "integer",
          description: "The number of nights the guest is going to book",
        },
        adults: {
          type: "integer",
          description: "The number of adults guests",
        },
        children: {
          type: "integer",
          description: "The number of children",
        },
        childrenAges: {
          type: "array",
          description: "The age of children",
          items: {
            type: "integer",
          },
        },
        dateCheckin: {
          type: "string",
          description: `The day the guest will check-in.`,
        },
        unit: {
          type: "string",
          enum: units,
          description: "The unit or room, this is optional you can ask later",
        },
        ratePlan: {
          type: "string",
          enum: ratePlans,
          description: "The Rate Plan, this is optional you can ask later",
        },
      },
      required: [
        "property",
        "nights",
        "adults",
        "children",
        "childrenAges",
        "dateCheckin",
        //"unit",
        //"ratePlan",
      ],
    },
  },
  {
    name: "genReservationLink",
    description: "Finish a the reservation process generating a link",
    parameters: {
      type: "object",
      properties: {
        property: {
          type: "string",
          enum: properties,
          description: "The property the guest wants to make a reservation",
        },
        nights: {
          type: "integer",
          description: "The number of nights the guest is going to book",
        },
        adults: {
          type: "integer",
          description: "The number of adults guests",
        },
        children: {
          type: "integer",
          description: "The number of children",
        },
        childrenAges: {
          type: "array",
          description: "The age of children",
          items: {
            type: "integer",
          },
        },
        dateCheckin: {
          type: "string",
          description: `The day the guest will check-in.`,
        },
        unit: {
          type: "string",
          enum: units,
          description: "The unit or room, this is optional you can ask later",
        },
        ratePlan: {
          type: "string",
          enum: ratePlans,
          description: "The Rate Plan, this is optional you can ask later",
        },
      },
      required: [
        "property",
        "nights",
        "adults",
        "children",
        "childrenAges",
        "dateCheckin",
        //"unit",
        //"ratePlan",
      ],
    },
  },
  {
    name: "getPropertyTypes",
    description: "Get the types of the properties available",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "getDestinations",
    description: "Get the destinations (country and city)",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "getPropertyGroups",
    description: "Get the Groups of properties available",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "getPropertyList",
    description: "Get the Properties list available",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "getUnitList",
    description: "Get the list of units or types or categories of rooms",
    parameters: {
      type: "object",
      properties: {
        property: {
          type: "string",
          enum: properties,
          description: "The property",
        },
      },
      required: ["property"],
    },
  },
  {
    name: "getAmenitiesList",
    description:
      "Get the list of amenities or services available in each property",
    parameters: {
      type: "object",
      properties: {
        property: {
          type: "string",
          enum: properties,
          description: "The property",
        },
      },
      required: ["property"],
    },
  },
  {
    name: "getRatePlans",
    description:
      "Get the list of rate plans based on the property and the year",
    parameters: {
      type: "object",
      properties: {
        property: {
          type: "string",
          enum: properties,
          description: "The property",
        },
        year: {
          type: "integer",
          description: "The year for the rate plan",
        },
      },
      required: ["property", "year"],
    },
  },
  {
    name: "getPropertyDescription",
    description: "Get the description of a property",
    parameters: {
      type: "object",
      properties: {
        property: {
          type: "string",
          enum: properties,
          description: "The property",
        },
      },
      required: ["property"],
    },
  },
  {
    name: "getPropertyContact",
    description:
      "Get the contact information such as the email, telephone fax and website of a property, also get the location",
    parameters: {
      type: "object",
      properties: {
        property: {
          type: "string",
          enum: properties,
          description: "The property",
        },
      },
      required: ["property"],
    },
  },
  {
    name: "getUnitDescription",
    description: "Get the description of a unit or room type",
    parameters: {
      type: "object",
      properties: {
        unit: {
          type: "string",
          enum: units,
          description: "The unit or room type",
        },
      },
      required: ["unit"],
    },
  },
  {
    name: "getRatePlanDescription",
    description: "Get the description of a rate plan",
    parameters: {
      type: "object",
      properties: {
        ratePlan: {
          type: "string",
          enum: ratePlans,
          description: "The Rate Plan",
        },
      },
      required: ["ratePlan"],
    },
  },
];

module.exports = { systemPrompt, functions };

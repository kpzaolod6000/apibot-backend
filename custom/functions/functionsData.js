const { cancellationPolicy, premiumCollection } = require("./fmtg");
const {
  listUnits,
  list,
  listRatePlans,
  descript,
  availability,
  listAmenities,
  calendar,
} = require("./phobs");
const { openai, palm } = require("../../utils/helper");
const { coreFunctionMappings } = require("../../core/functionsData");

const functionMappings = {
  ...coreFunctionMappings,
  cancellationPolicy: async (messages) => {
    const completion_text = cancellationPolicy();
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content: "Answer the user with cancellation policy data. Data:" +
            //"Give a answer based on the types of properties, if it says error say no information available
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  premiumCollection: async (messages) => {
    const completion_text = premiumCollection();
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user about the Premium Collection Hotels information based on the list, give the hotel website as follow: [name](url). Data:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  setBooking: async (messages, stream, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    console.log(completionArguments);

    const date = new Date(completionArguments.dateCheckin);
    const datetime = new Date();
    if (date < datetime) {
      console.log("antes");
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Say to the user that the provided date is in the past, that you need a future date to make the booking process",
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } else if (!completionArguments.unit) {
      console.log("no unit")
      const completion_units = await listUnits(completionArguments.property);
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "List the user the available units for make a reservation and make recommendations based on the user conversation. Be concise. Ask the user which one to choose: Units:" +
            completion_units,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } else if (!completionArguments.ratePlan) {
      console.log("no rp")
      const completion_rates = await listRatePlans(
        completionArguments.property,
      );
      console.log(completion_rates)
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "List the user the available rate plans for include in the reservation, make recommendations based on the user conversation. Be concise. Ask the user which one to choose: Rate Plans:" +
            completion_rates,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } else {
      console.log("last")
      /*const date = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Transform the date to the structure: year-month-day, give me just the date. Example: 2023-09-14. Date:" +
            completionArguments.dateCheckin,
        }],
      });*/
      //const dateTransform = date.choices[1].message.content;
      //console.log(dateTransform);
      const completion_text = await availability(
        completionArguments.property,
        completionArguments.nights,
        completionArguments.dateCheckin,
        completionArguments.unit,
        completionArguments.ratePlan,
        completionArguments.adults,
        completionArguments.childrenAges,
      );
      const validation = await calendar(
        completionArguments.property,
        completionArguments.dateCheckin,
        completionArguments.unit,
      );
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [{
            role: "system",
            content:
              "Based on the data verify if the property is available. 1 is available 0 is not available. If is available answer just a '0'. If is not available give the user the dates that are available to chose. Data" +
              //"Give a answer based on the types of properties, if it says error say no information available" +
              validation,
          }, ...messages],
        });
        const checkVal = completion.choices[0].message.content;
        if (checkVal == 0) {
          try {
            const completion = await openai.chat.completions.create({
              model: "gpt-4-1106-preview",
              messages: [{
                role: "system",
                content:
                  "Give the user the information about the booking. Also if available give the BookUrl as follow: [name](url)" +
                  //"Give a answer based on the types of properties, if it says error say no information available" +
                  completion_text,
              }, ...messages],
            });
            return completion.choices[0].message.content;
          } catch (error) {
            if (error.response) {
              console.log(error.response.status);
              console.log(error.response.data);
            } else {
              console.log(error.message);
            }
          }
        } else {
          return checkVal;
        }
      } catch (error) {
        if (error.response) {
          console.log(error.response.status);
          console.log(error.response.data);
        } else {
          console.log(error.message);
        }
      }
    }
  },
  getPropertyTypes: async (messages) => {
    const completion_text = await list("ListPropertyType");
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content: "Answer the user based on the differents properties. Data:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getDestinations: async (messages) => {
    const completion_text = await list("ListDestination");
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user based on the available destinations, give a few details about the destinations. Ask if the user wants to make a reservation there. Data:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getPropertyGroups: async (messages) => {
    const completion_text = await list("ListPropertyGroups");
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user based on the available property groups. Data:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getPropertyList: async (messages) => {
    const completion_text = await list("ListProperties");
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user based on the available properties give the hotel website as follow: [name](url). Ask the user which one of them is interested to make a reservation. Data:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getUnitList: async (messages, stream, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await listUnits(completionArguments.property);
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user based on the differents units available in the data, give a short description.You are a helpful assistant. Transform the data into a more natural information, ask which one is interested. Units:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getAmenitiesList: async (messages, stream, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await listAmenities(completionArguments.property);
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer briefly the user based on the differents amenities available. Amenities: " +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getRatePlans: async (messages, stream, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await listRatePlans(
      completionArguments.property,
      completionArguments.year,
    );
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user based on the differents rate plans available in the data, give a short description. Transform the data into a more natural information, ask which one is interested. Rate plans:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getPropertyDescription: async (messages, stream, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await descript(
      completionArguments.property,
      "DescProperty",
      "PropertyId",
    );
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user based on the property description avoid the images. If there is a website answer as follow [name](url). Ask the user if is interested in that property to make a reservation. Property:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getPropertyContact: async (messages, stream, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await descript(
      completionArguments.property,
      "DescProperty",
      "PropertyId",
    );
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user with the contact information such as the email as plain text, telephone number without spaces, fax without spaces, website as follow [name](url) and address based on the property data. Property:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getUnitDescription: async (messages, stream, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await descript(
      completionArguments.unit,
      "DescUnit",
      "UnitId",
    );
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user in max 3 sentences based on the unit description. Ask the user if is interested in that unit. Unit:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getRatePlanDescription: async (messages, stream, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await descript(
      completionArguments.ratePlan,
      "DescRatePlan",
      "RateId",
    );
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user in max 3 sentences based on the rate plan description. Ask if the user wants to include this rate plan. Rate Plan:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  // Add more functions
};

const functionBardMappings = {
  ...coreFunctionMappings,
  cancellationPolicy: async (messages) => {
    const completion_text = cancellationPolicy();
    console.log(completion_text);
    try {
      const result = await palm.generateMessage({
        model: "models/chat-bison-001", // Required. The model to use to generate the result.
        temperature: 0.5, // Optional. Value `0.0` always uses the highest-probability result.
        candidateCount: 1, // Optional. The number of candidate results to generate.
        prompt: {
          context: "Answer the user with cancellation policy data. Data: " +
            completion_text,
          messages: [...messages],
        },
      });
      return result[0].candidates[0].content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  premiumCollection: async (messages) => {
    const completion_text = premiumCollection();
    console.log(completion_text);
    try {
      const result = await palm.generateMessage({
        model: "models/chat-bison-001", // Required. The model to use to generate the result.
        temperature: 0.0, // Optional. Value `0.0` always uses the highest-probability result.
        candidateCount: 1, // Optional. The number of candidate results to generate.
        prompt: {
          context:
            "Answer the user about the Premium Collection Hotels information based on the list, give the hotel website as follow: [name](url). Data:" +
            completion_text,
          messages: [...messages],
        },
      });
      return result[0].candidates[0].content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getAvailability: async (messages, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    console.log(completionArguments);

    const date = new Date(completionArguments.dateCheckin);
    const datetime = new Date();
    if (date < datetime) {
      console.log("antes");
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Say to the user that the provided date is in the past, that you need a future date to make the booking process",
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } else if (!completionArguments.unit) {
      const completion_text = await listUnits(completionArguments.property);
      const result = await palm.generateMessage({
        model: "models/chat-bison-001", // Required. The model to use to generate the result.
        temperature: 0.0, // Optional. Value `0.0` always uses the highest-probability result.
        candidateCount: 1, // Optional. The number of candidate results to generate.
        prompt: {
          context:
            "List the user the available units for make a reservation and make recommendations based on the user conversation. Be concise. Ask the user which one to choose: Units: " +
            completion_text,
          messages: [...messages],
        },
      });
      return result[0].candidates[0].content;
    } else if (!completionArguments.ratePlan) {
      const completion_text = await listRatePlans(
        completionArguments.property,
      );
      const result = await palm.generateMessage({
        model: "models/chat-bison-001", // Required. The model to use to generate the result.
        temperature: 0.2, // Optional. Value `0.0` always uses the highest-probability result.
        candidateCount: 1, // Optional. The number of candidate results to generate.
        prompt: {
          context:
            "List the user the available rate plans for include in the reservation, make recommendations based on the user conversation. Be concise. Ask the user which one to choose: Rate Plans: " +
            completion_text,
          messages: [...messages],
        },
      });
      return result[0].candidates[0].content;
    } else {
      const date = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Transform the date to the structure: year-month-day, give me just the date. Example: 2023-09-14. Date:" +
            completionArguments.dateCheckin,
        }],
      });
      const dateTransform = date.choices[1].message.content;
      console.log(dateTransform);
      const completion_text = await availability(
        completionArguments.property,
        completionArguments.nights,
        dateTransform,
        completionArguments.unit,
        completionArguments.ratePlan,
        completionArguments.adults,
        completionArguments.childrenAges,
      );
      if (completion_text.error) {
        console.log("dcewfcwec");
      } else {
        try {
          const result = await palm.generateMessage({
            model: "models/chat-bison-001", // Required. The model to use to generate the result.
            temperature: 0.0, // Optional. Value `0.0` always uses the highest-probability result.
            candidateCount: 1, // Optional. The number of candidate results to generate.
            prompt: {
              context:
                "Give the user the information about the booking. Also if available give the BookUrl as follow: [name](url) " +
                completion_text,
              messages: [...messages],
            },
          });
          return result[0].candidates[0].content;
        } catch (error) {
          if (error.response) {
            console.log(error.response.status);
            console.log(error.response.data);
          } else {
            console.log(error.message);
          }
        }
      }
    }
  },
  getPropertyTypes: async (messages) => {
    const completion_text = await list("ListPropertyType");
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content: "Answer the user based on the differents properties. Data:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getDestinations: async (messages) => {
    const completion_text = await list("ListDestination");
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user based on the available destinations, give a few details about the destinations. Ask if the user wants to make a reservation there. Data:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getPropertyGroups: async (messages) => {
    const completion_text = await list("ListPropertyGroups");
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user based on the available property groups. Data:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getPropertyList: async (messages) => {
    const completion_text = await list("ListProperties");
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user based on the available properties give the hotel website as follow: [name](url). Ask the user which one of them is interested to make a reservation. Data:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getUnitList: async (messages, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await listUnits(completionArguments.property);
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user based on the differents units available in the data, give a short description. Transform the data into a more natural information, ask which one is interested. Units:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getAmenitiesList: async (messages, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await listAmenities(completionArguments.property);
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer briefly the user based on the differents amenities available. Amenities: " +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getRatePlans: async (messages, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await listRatePlans(
      completionArguments.property,
      completionArguments.year,
    );
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user based on the differents rate plans available in the data, give a short description. Transform the data into a more natural information, ask which one is interested. Rate plans:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getPropertyDescription: async (messages, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await descript(
      completionArguments.property,
      "DescProperty",
      "PropertyId",
    );
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user based on the property description avoid the images. If there is a website answer as follow [name](url). Ask the user if is interested in that property to make a reservation. Property:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getPropertyContact: async (messages, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await descript(
      completionArguments.property,
      "DescProperty",
      "PropertyId",
    );
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user with the contact information such as the email as plain text, telephone number without spaces, fax without spaces, website as follow [name](url) and address based on the property data. Property:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getUnitDescription: async (messages, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await descript(
      completionArguments.unit,
      "DescUnit",
      "UnitId",
    );
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user in max 3 sentences based on the unit description. Ask the user if is interested in that unit. Unit:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  getRatePlanDescription: async (messages, arguments) => {
    const completionArguments = JSON.parse(
      arguments,
    );
    const completion_text = await descript(
      completionArguments.ratePlan,
      "DescRatePlan",
      "RateId",
    );
    console.log(completion_text);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [{
          role: "system",
          content:
            "Answer the user in max 3 sentences based on the rate plan description. Ask if the user wants to include this rate plan. Rate Plan:" +
            completion_text,
        }, ...messages],
      });
      return completion.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  },
  // Add more functions
};

module.exports = { functionMappings, functionBardMappings };

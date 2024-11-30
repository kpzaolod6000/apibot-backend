var environment = process.env.ENVIRONMENT;
environment = environment ? environment : 'dev';


var db_auth = process.env.DB_AUTH;
db_auth = db_auth ? db_auth : 'admin';


var database_name = process.env.MONGO_DATABASE;
var user = encodeURIComponent(process.env.MONGO_USER);
var password = encodeURIComponent(process.env.MONGO_PASS);
var authMechanism = process.env.MONGO_AUTH;
var server1 = process.env.MONGO_HOST+':'+process.env.MONGO_PORT;
var server2 = process.env.MONGO_REP_HOST+':'+process.env.MONGO_REP_PORT;
var replicaSet = process.env.MONGO_REP_SET;
var mongo_replica = process.env.MONGO_REPLICA;
//const MongoClient = require('mongodb').MongoClient;
const { MongoClient,ObjectId } = require("mongodb");
///var ObjectId = require('mongodb').ObjectID;
var f = require('util').format;


var options = {    
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

var mongourl;// = 'mongodb://localhost/ivr_sys';
if (mongo_replica == "true") {
  mongourl = f(
    'mongodb://%s:%s@' + server1 + ',' + server2 + '/'+db_auth+'?authMechanism=%s&replicaSet=' + replicaSet,
    user,
    password,
    authMechanism
  );
} else {
  if(environment == 'dev'){
    mongourl = 'mongodb://127.0.0.1/bot_chatgpt';
  }else{
    mongourl = f(
      'mongodb://%s:%s@'+server1+'/'+db_auth+'?authMechanism=%s',
        user,
        password,
        authMechanism
    ); 
  }
}

  var mongodb;
//   MongoClient.connect(mongourl,options,function(err, db) {
//     if (err) {
//       console.log("Hubo un error al iniciar conexion global",err);
//     }
//     mongodb=db;
//   });
const client_db = new MongoClient(mongourl);
async function connectToMongoDB() {
    try {
      await client_db.connect();
      console.log("Connected to MongoDB!");
      // Puedes continuar con tus operaciones en la base de datos aquí
      mongodb = client_db
    } catch (err) {
      console.error("Error connecting to MongoDB:", err);
    }
}
  
connectToMongoDB();

async function getdb_async(data) {
    var namecollection = data.collection;
    const mydb = mongodb.db(database_name);
    return await mydb.collection(namecollection, { safe: true });
}

async function connect() {

  // Se i nicia la conexion
  const client = await MongoClient.connect(mongourl,options)
    .catch(err => {
      console.log("Hubo un error al conectarse a la base de datos",err); 
    });

  if (!client) {
    console.log("No hubo respuesta al conectarse a la base de datos");
    return;
  }

  // Se asocia el cliente a la base de datos principal
  var db;
  try {
    db = client.db(database_name);
  }

  // La conexión fallo
  catch (err) {
    console.log("Hubo un error al seleccionar base de datos",err);
    client.close();
    return null;
  }

  // Se retorna al cliente iniciado
  return {
    client: client,
    db: db
  };
}

  function setField(arrModel, data) {
    var check = { "error": null, "data": {} };
    var error = { "message": "Campo requerido no fue enviado." };
    var i = 0;
  
    while (check.error == null && arrModel[i]) {
      var error = { "message": "Campo requerido " + arrModel[i].name + " no fue enviado." };
  
      var value = arrModel[i];
      if (value.required && data[value.index] == undefined) {
        check.error = error;
      }
      ///se verifica de acuerdo al tipo de dato.
      if (check.error == null) {
        if (value.type == "string") {
          check = validString(check.data, data, value);
        } else if (value.type == "number") {
          check = validNumber(check.data, data, value);
        } else if (value.type == "boolean") {
          check = validBoolean(check.data, data, value);
        } else if (value.type == "objectId") {
          check = validObjectid(check.data, data, value);
        } else if (value.type == "array") {
          check = validArray(check.data, data, value);
        } else if (value.type == "object") {
          check = validObject(check.data, data, value);
        } else if (value.type == "array_objectId") {
          check = validArray_objectId(check.data, data, value);
        }
      }
      i++;
    }
    if (check.data && check.data.subdomain) {
      delete check.data['subdomain'];
    }
    return check;
  }
  
  /**
   * Valida un campo string
   * @param {*} acunData 
   * @param {*} data 
   * @param {*} model 
   */
  function validString(acunData, data, model) {
    index = model.index;
    required = model.required;
    min_lenght = model.min_lenght ? model.min_lenght : 1;
  
    var retur = { "error": null, "data": acunData };
    var errorReq = { "message": "Complete los campos requeridos: " + model.name };
    var error = { "message": "Tipo de dato incorrecto: " + model.name };
  
  
    if (required && (getType(data[index]) != "string" || data[index].toString().trim().length < min_lenght)) {
      retur.error = errorReq;
      return retur;
    }
  
    if (data[index] != undefined && getType(data[index]) == "string") {
      acunData[index] = data[index].toString().trim();
      retur.data = acunData;
      return retur;
    }
    return retur;
  }

  /**
   * Valida un campo numerico
   * @param {*} acunData 
   * @param {*} data 
   * @param {*} model 
   */
  function validNumber(acunData, data, model) {
    index = model.index;
    required = model.required;
    min_lenght = model.min_lenght ? model.min_lenght : 1;
  
    var retur = { "error": null, "data": acunData };
    var errorReq = { "message": "Complete los campos requeridos: " + model.name };
    var error = { "message": "Tipo de dato incorrecto: " + model.name };
  
    if (required && (getType(data[index]) != "number" || data[index].toString().trim().length < min_lenght)) {
      retur.error = errorReq;
      return retur;
    }
    if (data[index] != undefined && getType(data[index]) == "number") {
      acunData[index] = parseFloat(data[index].toString().trim());
      retur.data = acunData;
      return retur;
    }
    return retur;
  }
  
  /**
   * Valida un campo booleano
   * @param {*} acunData 
   * @param {*} data 
   * @param {*} model 
   */
  function validBoolean(acunData, data, model) {
    index = model.index;
    required = model.required;
    // min_lenght = model.min_lenght ? model.min_lenght : 1;
  
    var retur = { "error": null, "data": acunData };
    var errorReq = { "message": "Complete los campos requeridos: " + model.name };
    var error = { "message": "Tipo de dato incorrecto: " + model.name };
  
    if (required && (getType(data[index]) != "boolean")) {
      retur.error = errorReq;
      return retur;
    }
  
    if (data[index] != undefined && getType(data[index]) == "boolean") {
      acunData[index] = data[index];
      retur.data = acunData;
      return retur;
    }
    return retur;
  }
  
  /**
   * Valida un campo ObjectID de mongo
   * @param {*} acunData 
   * @param {*} data 
   * @param {*} model 
   */
  function validObjectid(acunData, data, model) {
    //console.log("validObjectid");
    //console.log(ObjectId);
    index = model.index;
    required = model.required;
    var len = model.len ? model.len : 24;
  
    var retur = { "error": null, "data": acunData };
    var errorReq = { "message": "Complete los campos requeridos: " + model.name };
    var error = { "message": "Tipo de dato incorrecto: " + model.name };
  
  
    if (required && (getType(data[index]) != "string" || data[index].toString().trim().length != len)) {
      retur.error = errorReq;
      return retur;
    }
  
    if (data[index] != undefined && getType(data[index]) == "string" && data[index].toString().length == 24) {
      acunData[index] = new ObjectId(data[index].toString().trim());
      retur.data = acunData;
      return retur;
    }
    return retur;
  }
  
  /**
   * Valida un campo arreglo
   * @param {*} acunData 
   * @param {*} data 
   * @param {*} model 
   */
  function validArray(acunData, data, model) {
    index = model.index;
    required = model.required;
    min_lenght = model.min_lenght ? model.min_lenght : 1;
  
    var retur = { "error": null, "data": acunData };
    var errorReq = { "message": "Complete los campos requeridos: " + model.name };
    var error = { "message": "Tipo de dato incorrecto: " + model.name };
  
  
    if (required && (getType(data[index]) != "array" || data[index].toString().trim().length < min_lenght)) {
      retur.error = errorReq;
      return retur;
    }
  
    if (data[index] != undefined && getType(data[index]) == "array" && data[index].length > 0) {
      acunData[index] = data[index];
      retur.data = acunData;
      return retur;
    }
    return retur;
  }
  
  /**
   * Valida un campo objeto
   * @param {*} acunData 
   * @param {*} data 
   * @param {*} model 
   */
  function validObject(acunData, data, model) {
    index = model.index;
    required = model.required;
    min_lenght = model.min_lenght ? model.min_lenght : 1;
  
    var retur = { "error": null, "data": acunData };
    var errorReq = { "message": "Complete los campos requeridos: " + model.name };
    var error = { "message": "Tipo de dato incorrecto: " + model.name };
  
    if (required && (getType(data[index]) != "object" ||  Object.keys(data[index]).length < min_lenght)) {
      retur.error = errorReq;
      return retur;
    }
  
    if (data[index] != undefined && getType(data[index]) == "object" && Object.keys(data[index]).length > 0) {
      acunData[index] = data[index];
      retur.data = acunData;
      return retur;
    }
    return retur;
  }
  
  /**
   * Valida un campo arreglo de ObjectIDs
   * @param {*} acunData 
   * @param {*} data 
   * @param {*} model 
   */
  function validArray_objectId(acunData, data, model) {
    index = model.index;
    required = model.required;
    min_lenght = model.min_lenght ? model.min_lenght : 1;
    var len = 24;
  
    var retur = { "error": null, "data": acunData };
    var errorReq = { "message": "Complete los campos requeridos: " + model.name };
    var error = { "message": "Tipo de dato incorrecto: " + model.name };
  
  
    if (required && (getType(data[index]) != "array" || data[index].toString().trim().length < min_lenght)) {
      retur.error = errorReq;
      return retur;
    }
  
    if (data[index] != undefined && getType(data[index]) == "array" && data[index].length > 0) {
      var new_arr = [];
      data[index].forEach(function (value_a, index_a) {
        //se comprueba que el dato sea objectId, si uno no es, entonces se envia error
        if (getType(value_a) != "string" || value_a.toString().trim().length != len) {
          retur.error = errorReq;
          return retur;
        }
        //si es objectid,entonces se agrega
        new_arr[index_a] = ObjectId(value_a.toString().trim());
      })
  
      acunData[index] = new_arr;
      retur.data = acunData;
      return retur;
    }
    return retur;
  }

  function getType(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  }

module.exports.getdb_async = getdb_async;
module.exports.setField = setField;
module.exports.connect = connect;

var db_mongo = require("../services/db_mongo");
let db_coll_message = { collection: `messages` };

async function find_group(data) {
    var model = [
        {name:"indentificador de chat", index:"chat_id",type:"objectId",required:1}
    ];
	var param = data;
	param = db_mongo.setField(model,param);
	if(param.error != null){
      return param;
	}
    let body = param.data;

    var aggre = [
        { $match: 
            {
            $and: [
                { "chat_id": body.chat_id }
            ]
            }
        }
    ];


    var collection = await db_mongo.getdb_async(db_coll_message);
    let user_selected = await collection.aggregate(aggre).toArray();
    return user_selected;
}

async function insert(data) {
    var model = [
        {name:"indentificador de chat", index:"chat_id",type:"objectId",required:1},
        {name:"mensaje a guardar", index:"message",type:"string",required:1},
        {name:"entidad que envio el mensaje", index:"emisor",type:"number",required:1}, //1:usuario 2:asistente
        {name:"proveedor de inteligencia artificial", index:"provider", type:"number",required:1}
    ];

	var param = data;
	param = db_mongo.setField(model,param);
	if(param.error != null){
      return param;
	}
    let body = param.data;
    var now = new Date().getTime();
    body.date_create = now;
    body.status = 1;

    var collection = await db_mongo.getdb_async(db_coll_message);
    let user_selected = await collection.insertOne(body);
    return user_selected;
}

module.exports.find_group = find_group;
module.exports.insert = insert;
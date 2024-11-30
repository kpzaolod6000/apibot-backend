# Chatbot AI

# Dependencias del proyecto
- NodeJS 18+
- NPM 
- MongoDB 6
- API Key de Open AI se obtiene desde https://platform.openai.com/api-keys

El despliegue y pruebas se han realizado con las versiones especificadas, sin embargo, puede probar con versiones inferiores y revisar comportamiento, si llegase a usar otras versiones cree un Pull Request de este README para agregarlo como documentacion.

# Configuracion del proyecto

1. Clonar el repositorio usando ```git clone https://gitlab.inticousa.com/agente-multicanal/apibot_ai.git```
2. Ir al proyecto ```cd apibot_ai```
3. Clonar el archivo .env.example y renombrarlo por .env
4. Agregar el Token del proveedor que necesite.
    4.1 ```OPENAI_API_KEY``` para el modelo GPT de OpenAI.
    4.2 ```PALM_API_KEY``` para el modelo Bard (ahora Gemini), este modelo no ha sido probado ni mantenido nuevamente.
5. Ejecutar el comando ```npm i``` para instalar las dependencias (node_modules)

# Ejecucion del proyecto

## Entrenamiento 
El proyecto cuenta con unos vectores y listo para usar sin necesidad de hacer un entrenamiento previo, sin embargo si desea entrenar nuevamente el modelo con nuevos datos debe ejecutar los pasos de esta seccion.
Para el entrenamiento del bot, debe agregar la informacion en el archivo ```custom/sourceData/sourceFile.txt```, lo siguiente es volver a crear los Embeddings con el siguiente comando:
```node utils/embedding.js ```
Vera los resultados en consola.

## Ejecutar proyecto
Para comenzar a ejecutar el proyecto realice ```npm run dev``` para ejecutarlo con nodemon o solo ```node api_gpt```, el servicio por defecto estara disponible en http://localhost:3000
Tenga en cuenta tener levantado el servicio de MongoDB, no sera necesario importar ninguna Base de Datos (BD), sin embargo servira para registrar la informacion en la BD que se cree automaticamente llamada "bot_chatgpt"

## Pruebas con los servicios API REST
El servicio API disponible permitira tener la comunicacion con el bot y su base de conocimiento que se explico en el paso anterior, existen dos servicios; respuesta inmediata, respuesta stream.


### Respuesta inmediata
Dependiendo del contexto y la cantidad de palabras, podria tomar mas tiempo en responder para devolver todo el contenido en una sola respuesta.
Ejecute, copie o importe en Postman la siguiente endpoint para cada tipo de respuesta para iniciar las pruebas:
```
curl --location 'http://localhost:3000/api/new_query' \
--header 'Content-Type: application/json' \
--data '{
    "id": "64fb526288a0fcfc77e8ed82",
    "message": "hello"
}'
```

El siguiente JSON es un ejemplo de la respuesta que se recibira:
```
{
    "completion": "Hi! 😄 It looks like we're really enjoying saying hello! If you have any questions or need help with something specific, just let me know. How can I assist you today?",
    "transfer": {
        "status": false
    }
}
```

### Respuesta stream
Devolvera la respuesta en stream para ir entregando la informacion al cliente final. 

Ejecute el siguiente cURL en una consola por separado del servicio, el efecto de la respuesta podra ser visualizada en la consola donde ha levantado el proyecto:
```
curl --location 'http://localhost:3000/api/new_stream' \
--header 'Content-Type: application/json' \
--data '{
    "id": "64fb526288a0fcfc77e8ed82",
    "message": "hello"
}'
```



## Contribucion
Este proyecto esta abierto a nuevas contribuciones o cambios que usted crea conveniente, por favor sea libre de crear un Issue, Pull Request para contribuir al proyecto.

## Autores
Developer
- Miguel Sanabria


## Licencia
Este proyecto está licenciado bajo la Licencia Creative Commons Attribution-NonCommercial 4.0 International. Para ver una copia de esta licencia, visite [https://creativecommons.org/licenses/by-nc/4.0/legalcode](https://creativecommons.org/licenses/by-nc/4.0/legalcode).

## Estado del proyecto
Para fines de pruebas


const express = require('express');
const port = 5000;

const mongoose = require('mongoose');
const mongoTenant = require('mongo-tenant');

mongoose.connect('mongodb://127.0.0.1/TenantedHighscores')
const MyModel = mongoose.model('MyModel', MySchema);

const scoreSchema = new mongoose.Schema({
    name:{
        type: String,
        require: true
    },
    value:{
        type: Number,
        require: true
    },
    time: Number,
});
ScoreSchema.plugin(mongoTenant);

const ScoreModel = new mongoose.model("Score",scoreSchema);

//ex:
//const score_1 = new Score({
//    name: "AKJ",
//    value: 123321,
//    time: 100994
//});
//score_1.save();



//Admin
//Tenant/Project/Scores
//Tenant/Project

//Set up in main database
//Projects:
////uuid
////tenantid
////{othervalues}

//Scores
////Projectid
////name
////score
app.post()

//Tenants (Admin)
////Tenant
////passkey?

//Only admin can create new tenants
//Tenants need API passkeys to access their 



const app = express()


app.get('/tenants/:id',(req,res) => {
    res.send(req.params.id);
});

app.put('/tenants', (req,res) => {
    res.send("hello");
});



app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    
});


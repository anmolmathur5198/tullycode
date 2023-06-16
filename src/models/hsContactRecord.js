const mongoose = require("mongoose");
const HSContactRecordSchema = new mongoose.Schema({

  // additionalname:{
  //   type:String
  // },
  // courtesy_title:{
  //   type:String
  // },
  // firstname:{
  //   type:String
  // },
  // lastname:{
  //   type:String
  // },
  // hs_object_id:{
  //   type:String
  // },
  // middlename:{
  //   type:String
  // },
  // profile_number:{
  //   type:String
  // }, lastname:{
  //   type:String
  // },
  // referred_by:{
  //   type:String
  // },
  // salutation:{
  //   type:String
  // },
  // createdate:{
  //   type:String
  // },
  // lastmodifieddate:{
  //   type:String
  // },
  

  contact_detail_array: {
    type : Object
  },
  card_detail_array: {
    type : Array
  },
  address_detail_array: {
    type : Array
  }
},
  { timestamps: true, versionKey: false }
);

module.exports = HSContactRecord = mongoose.model("HSContactRecord", HSContactRecordSchema);




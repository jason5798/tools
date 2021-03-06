// grab the things we need
var mongoose = require('./mongoose.js');
var Schema = mongoose.Schema;

// create a schema
var deviceSchema = new Schema({
  macAddr : { type: String},
  data: { type: String},
  recv: { type: Date},
  date: { type: String},
  date: { type: String},
  info: { type: Schema.Types.Mixed}
});

// the schema is useless so far
// we need to create a model using it
var Device = mongoose.model('Device', deviceSchema);

// make this available to our users in our Node applications
module.exports = Device;

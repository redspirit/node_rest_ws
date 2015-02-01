/**
 * Created by Алексей on 31.01.2015.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var RegionSchema = new Schema({
    name: {
        type: String
    },
    bounding: {
        type: Schema.Types.Mixed
    },
    pos: {
        type: Schema.Types.Mixed
    },
    phones: [
        {type: String}
    ],
    satellites: [
        {type: String}
    ],
    orders: {
        type: Number,
        default: 0
    },
    default_fee: {
        type: Number,
        default: 5
    },
    code: {
        type: String,
        require: true
    },
    province: {
        type: String
    },
    timezone: {
        type: Number
    }
});



RegionSchema.methods.now = function(){
    var zone = this.timezone;
    return moment().utc().zone(-zone * 60).format();
};

exports.model = RegionSchema;

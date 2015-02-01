/**
 * Created by Алексей on 31.01.2015.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');
var _ = require('underscore');

var UserSchema = new Schema({
    phone: {
        type: String,
        required: true
    },
    token: {
        type: String
    },
    rtoken: {
        type: String
    },
    name: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    },
    last_login: {
        type: String
    },
    reg_date: {
        type: String
    },
    region: {				// код региона
        type: String
    },
    active: {               // активен ли водитель (можно заблокировать)
        type: Boolean,
        default: true
    }
});



UserSchema.methods.changeRating = function(value, reason, cb){
    var stat = _.clone(this.stat);

    stat.rating += value;

    console.log('У пользователя', this.phone, 'изменился рейтинг на ', value, 'по причине', reason);
    var rate = new exports.Rating({
        user: this._id,
        date: exports.now(),
        value: value,
        reason: reason
    });

    this.stat = stat;

    rate.save(cb);
    this.save();
};

UserSchema.methods.sms = function(message, cb){

};

UserSchema.methods.now = function(){
    var zone = this.timezone;
    return moment().utc().zone(-zone * 60).format();
};

exports.model = UserSchema;
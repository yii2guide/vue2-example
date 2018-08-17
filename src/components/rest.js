import config from "./config";
import axios from "axios";
import auth from "../modules/account/models/auth";
import authHelper from "../modules/account/helpers/authHelper";
import event from "./event";

function errorHandle(response) {
    if (response.status >= 500) {
        alert('Server error!!');
    }
    if (response.status === 401) {
        auth.logout(function () {});
        authHelper.redirectToLoginPage();
    }
    if (response.status === 403) {
        alert('Forbidden!');
    }
}

export default {

    post: function (uri, data, headers, cb) {
        event.trigger('rest-before', {uri: uri, data: data, headers: headers, cb: cb});
        axios.post(config.server.domain + '/' + uri, data, cb)
            .then(response => {
                //console.log(response.data);
                cb(response);
            })
            .catch(error => {
                errorHandle(error.response);
                //if (error.response.status === 422) {
                //    console.log(error.response.data);
                //}
                cb(error.response)
            })
    },

    get: function (uri, data, headers, cb) {
        event.trigger('rest-before', {uri: uri, data: data, headers: headers, cb: cb});
        const axiosInstance = axios.create({
            headers: headers,
        });
        axiosInstance.headers.Authorization = auth.getToken();
        axiosInstance.get(config.server.domain + '/' + uri, cb)
            .then(response => {
                //console.log(response.data);
                cb(response);
                event.trigger('rest-end-success', response);
            })
            .catch(error => {
                errorHandle(error.response);
                //if (error.response.status === 422) {
                //    console.log(error.response.data);
                //}
                cb(error.response);
                event.trigger('rest-end-error', error.response);
            })
    },

};
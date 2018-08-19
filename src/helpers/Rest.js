import client from "axios";
import Event from "./Event";
import store from "../config/store";

export default {

    post: function (uri, data, headers, cb) {
        this.beforeRequestTrigger(uri, data, headers, cb);
        const clientInstance = this.getInstance();
        let responsePromise = clientInstance.post(uri, data);
        return this.runResponsePromise(responsePromise, cb);
    },

    get: function (uri, data, headers, cb) {
        let url = this.forgeUrl(uri, data);
        this.beforeRequestTrigger(url, data, headers, cb);
        let clientInstance = this.getInstance();
        let responsePromise = clientInstance.get(url);
        return this.runResponsePromise(responsePromise, cb);
    },

    forgeUrl(uri, query) {
        let url = uri;
        let queryString = this.encodeQueryData(query);
        if(queryString !== '') {
            url = url + '?' + queryString;
        }
        return url;
    },

    beforeRequestTrigger(uri, data, headers, cb) {
        Event.trigger('rest-request-before', {uri: uri, data: data, headers: headers, cb: cb});
    },

    runResponsePromise(responsePromise, cb) {
        return responsePromise
            .then(response => {
                return this.runAfterResponse(response, cb);
            })
            .catch(error => {
                return this.runAfterResponse(error, cb);
            });
    },

    runAfterResponse(clientResponse, cb) {
        let response = this.createResponse(clientResponse);
        Event.trigger('rest-request-after', response);
        return cb(response);
    },

    forgePaginate(clientResponse) {
        let headers = clientResponse.headers;
        if(headers['x-pagination-current-page'] || ['x-pagination-total-count']) {
            return {
                currentPage: headers['x-pagination-current-page'] ? headers['x-pagination-current-page'] : 1,
                pageCount: headers['x-pagination-page-count'] ? headers['x-pagination-page-count'] : 0,
                perPage: headers['x-pagination-per-page'] ? headers['x-pagination-per-page'] : 10,
                totalCount: headers['x-pagination-total-count'] ? headers['x-pagination-total-count'] : 0,
            };
        }
        return null;
    },

    createResponse(clientResponse) {
        if(clientResponse.response) {
            clientResponse = clientResponse.response;
        }
        let response = {};
        response.status = clientResponse.status;
        response.data = clientResponse.data;
        response.headers = clientResponse.headers;
        if(response.status < 400) {
            response.error = null;
        } else if(response.status >= 400 && response.status < 500) {
            response.error = 'client';
        } else if(response.status >= 500) {
            response.error = 'server';
        }
        response.paginate = this.forgePaginate(clientResponse);
        return response;
    },

    getInstance() {
         return client.create({
            baseURL: store.config.server.domain + '/',
            headers: {
                'Authorization': store.auth.getters.token(),
            }
        });
    },

    encodeQueryData(data) {
        let ret = [];
        for (let d in data)
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
        return ret.join('&');
    },

}



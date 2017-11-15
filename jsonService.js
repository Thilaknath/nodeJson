const rp = require('request-promise-native');
const request = require('request');
const fs = require('fs');

const mapUtility = require('./utilityMethods')

const kibanaEndpoint = '';
const uaaURL = '';
const user = '';
const pwd = '';

var production = [];

const jsonModified = '';
const post_options = {
    url: uaaURL + "/oauth/token",
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic Y2Y6'
    },
    form: {
        username: user,
        password: pwd,
        grant_type: "password",
        response_type: "token"
    },
    timeout: 10000
}

function _request() {
    rp.post(post_options).then((res) => {
        var cust_req = {}
        var body = JSON.parse(res);
        cust_req.access_token = body.access_token;
        cust_req.jar = rp.jar();
        return cust_req;

    }).then((obj) => {
        var options = {
            url: kibanaEndpoint + '/app/kibana#/discover',
            jar: obj.jar,
            followRedirect: false
        }

        request.get(options, (err, res, body) => {
            var stateIndex = body.indexOf(";state=");

            if (stateIndex == -1) {
                callback(new Error("No state letiable found in discovery for url:" + logsUrl + "/app/kibana#/discover" + ", response was: " + JSON.stringify(res)));
            }

            var stateFinished = body.indexOf("\">");
            obj.state = body.substring(stateIndex + 7, stateFinished);

            var get_options = {
                url: uaaURL + "/oauth/authorize?grant_type=authorization_code&client_id=sleeve-app-logs&response_type=code&state=" + obj.state,
                jar: obj.jar,
                headers: {
                    Authorization: "bearer " + obj.access_token
                }
            }

            rp(get_options).then((res) => {
                let reqFile = './newQueryThilak.json';
                var queryPost_options = {
                    url: kibanaEndpoint + "/elasticsearch/_msearch",
                    jar: obj.jar,
                    followRedirect: false,
                    headers: {
                        'kbn-version': '5.3.1'
                    },
                    form: mapUtility._kibanaQuery(reqFile)
                }

                rp.post(queryPost_options).then((res) => {
                    var responseStatusMap = new Map();
                    var responseSizeMap = new Map();
                    var reponseTimeMap = new Map();

                    var body = JSON.parse(res);

                    // fs.writeFileSync('notes-data.json', res);
                    responseStatusMap = mapUtility._processElasticLogs(body);
                    responseSizeMap = mapUtility._processResponse_Size(body);
                    reponseTimeMap = mapUtility._processResponse_Time(body);

                    const format200StatusMap = mapUtility._printKeyValue(responseStatusMap, 'per_app_successful_http_requests');
                    const formatResponseSizeMap = mapUtility._printKeyValue(responseSizeMap, 'per_app_response_sizes');
                    const formatReponseTime = mapUtility._printKeyValue(reponseTimeMap, 'per_app_response_time');

                    if (Array.isArray(format200StatusMap['production'])) {
                        format200StatusMap['production'].forEach((a) => {
                            production.push(a);
                        });
                    }

                    if (Array.isArray(formatResponseSizeMap['production'])) {
                        formatResponseSizeMap['production'].forEach((a) => {
                            production.push(a);
                        });
                    }

                    if (Array.isArray(formatReponseTime['production'])) {
                        formatReponseTime['production'].forEach((a) => {
                            production.push(a);
                        });
                    }

                    return production;
                    console.log(production);
                })

            })
        })

    }).catch((errorMessage) => {
        console.log(errorMessage);
    })
}

module.exports = {
    _request
}

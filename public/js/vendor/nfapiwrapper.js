/**
 * API Wrapper for NowFinity Pointssystem
 * jQuery is required!
 */

function NowFinityApi(customHost, $iframe = null) {
  let host = new URL(customHost || "https://nowfinity.zerody.one/");
  let channelId = localStorage.getItem("nf_channelId");
  let channelSignature = localStorage.getItem("nf_channelSignature");

  function isLoggedIn() {
    return channelId !== null && channelSignature !== null;
  }

  function getChannelId() {
    return channelId;
  }

  function requestAuth() {
    return new Promise((resolve, reject) => {
      if ($iframe) {
        console.log();
      }
      let popup = window.open(
        host.origin +
          "/tp/authorize?origin=" +
          encodeURIComponent(window.location.origin),
        "",
        "width=600,height=400,status=yes,scrollbars=yes,resizable=yes"
      );

      let checker = setInterval(() => {
        if (popup.closed) {
          clearInterval(checker);
          reject();
        }
      }, 100);

      let messageHandler = function (message) {
        if (
          message.origin === host.origin &&
          typeof message.data === "object" &&
          message.data.channelId
        ) {
          localStorage.setItem("nf_channelId", message.data.channelId);
          localStorage.setItem(
            "nf_channelSignature",
            message.data.channelSignature
          );

          channelId = message.data.channelId;
          channelSignature = message.data.channelSignature;

          window.removeEventListener("message", messageHandler);

          resolve(channelId, channelSignature);
        }
      };

      window.addEventListener("message", messageHandler);
    });
  }

  function get(endpoint, params, extraOptions) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url:
          host.origin +
          "/api/" +
          endpoint +
          (params ? "?" : "") +
          new URLSearchParams(params).toString(),
        type: "GET",
        success: function (data) {
          resolve(data);
        },
        error: function (error) {
          reject(error);
        },
        ...extraOptions,
      });
    });
  }

  function doRequest(method, endpoint, data, extraOptions) {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: method,
        url: host.origin + "/api/" + endpoint,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        beforeSend: function (request) {
          if (channelId) {
            request.setRequestHeader("X-Channel-ID", channelId);
          }

          if (channelSignature) {
            request.setRequestHeader("X-Channel-Signature", channelSignature);
          }
        },
        success: function (data) {
          resolve(data);
        },
        error: function (error) {
          reject(error);
        },
        ...extraOptions,
      });
    });
  }

  function put(endpoint, data, extraOptions) {
    return doRequest("PUT", endpoint, data, extraOptions);
  }

  function post(endpoint, data, extraOptions) {
    return doRequest("POST", endpoint, data, extraOptions);
  }

  function patch(endpoint, data, extraOptions) {
    return doRequest("PATCH", endpoint, data, extraOptions);
  }

  function logout() {
    localStorage.removeItem("nf_channelId");
    localStorage.removeItem("nf_channelSignature");
    channelId = null;
    channelSignature = null;
  }

  return {
    isLoggedIn,
    getChannelId,
    requestAuth,
    get,
    put,
    post,
    patch,
    logout,
  };
}

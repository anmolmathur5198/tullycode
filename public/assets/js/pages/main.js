/* Show Sweetalert Loader */
function showProcessing() {
  let timerInterval;
  Swal.fire({
    title: "Processing...",
    // html: "I will close in <b></b> milliseconds.",
    // timer: 2000,
    timerProgressBar: true,
    didOpen: () => {
      Swal.showLoading();
      //   timerInterval = setInterval(() => {
      //     const content = Swal.getContent();
      //     if (content) {
      //       const b = content.querySelector("b");
      //       if (b) {
      //         b.textContent = Swal.getTimerLeft();
      //       }
      //     }
      //   }, 100);
      // },
      // willClose: () => {
      //   clearInterval(timerInterval);
    },
  }).then((result) => {
    /* Read more about handling dismissals below */
    // if (result.dismiss === Swal.DismissReason.timer) {
    //   console.log("I was closed by the timer");
    // }
  });
}

/* Search url params */
function searchUrlParams() {
  let urlParams = new URLSearchParams(location.search);
  let hvrif = urlParams.get("hvrif");
  let plat = urlParams.get("plat");
  if (location.pathname !== "/404") {
    if (location.pathname !== "/") {
      // if (!hvrif) location.href = "/404";
      // if (!plat) location.href = "/404";
    }
  }
}

/* Get Query Params */
function getQueryParams() {
  let urlParams = new URLSearchParams(location.search);
  let hvrif = urlParams.get("hvrif");
  let plat = urlParams.get("plat");
  let success = urlParams.get("success");
  let succes = urlParams.get("succes");

  return {
    hvrif,
    plat,
    success,
    succes,
  };
}

/* Validation method for ajax forms */
/**
 * @param rules Provide Rules for Validation
 * @param constraint Provide Form Validation Data
 */
function validateAjaxForm(validate, constraint) {
  let error = false;
  let formId = constraint;
  constraint = $("#" + constraint).serializeArray();
  if (constraint instanceof Array) {
    var formFields = {};
    constraint.map((mp) => {
      formFields[mp.name] = mp.value;
    });
    constraint.map((mp) => {
      if (validate.rules[mp.name]) {
        // console.log(validate.rules[mp.name], mp.value);
        if (validate.rules[mp.name].required && mp.value == "") {
          $("#" + formId)
            .find(`input[name=${mp.name}]`)
            .siblings(".invalid")
            .remove();
          $("#" + formId)
            .find(`input[name=${mp.name}]`)
            .parent()
            .append(
              `<span class="invalid text-danger">${
                validate.rules[mp.name].message
              }</span>`
            );
          // $("#" + formId)
          //   .find(`input[name=${mp.name}]`)
          //   .css({ "box-shadow": "inset 0 -2px 0 red !important" });
          error = true;
        }
        if (mp.name == "confirmpassword" && validate.rules["password"]) {
          // console.log(mp.value, "____", formFields["password"]);
          if (mp.value !== formFields["password"]) {
            $("#" + formId)
              .find(`input[name=${mp.name}]`)
              .siblings(".invalid")
              .remove();
            $("#" + formId)
              .find(`input[name=${mp.name}]`)
              .parent()
              .append(
                `<span class="invalid text-danger">${
                  validate.rules[mp.name].matched
                }</span>`
              );

            error = true;
          }
        }
      }
    });
    return error;
  }
}

/* Ajax Request */
async function ajaxRequest(req) {
  let options = {
    method: req.method || "GET",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };
  if (req.method.toLowerCase() == "post" || req.method.toLowerCase() == "put") {
    options["body"] = JSON.stringify(req.body);
  }
  let response = await fetch(req.url, options);
  let data = await response.json();
  return data;
}

/* Creating Dynamic Modal */
function dynamicBootstrapModal(md) {
  return `<div class="${md.modal}" id="${md.id}" tabindex="-1" role="dialog" aria-labelledby="myModalLabel"
    aria-hidden="true">
    <div class="${md.dialog}" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title w-100" id="myModalLabel">${md.title}</h4>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">${md.body}</div>
        <div class="modal-footer justify-content-center">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">
            Close
          </button>
          <!-- <button type="button" class="btn btn-primary">Save changes</button> -->
        </div>
      </div>
    </div>
  </div>`;
}
/* Get HubSpot Account Details */
async function getHubSpotAccountDetails() {
  let response = await ajaxRequest({
    url: "/account_details/" + location.search,
    method: "GET",
  });
  if (response.success) {
    let get_owner_account_data = response.data;
    let account_details_table = `
                <tr>
                  <th>Email </th>
                  <td>:</td>
                  <td>${get_owner_account_data.email}</td>
                </tr>
                <tr>
                  <th>Name </th>
                  <td>:</td>
                  <td>${get_owner_account_data.firstName} ${get_owner_account_data.lastName}</td>
                </tr>
              `;

           
    $(".user_name >span.user_name_hubspot").text(
      `${get_owner_account_data.firstName} ${get_owner_account_data.lastName}`
    );
    $(".login-user-name >span.user-name-hubspot").text(
      `${get_owner_account_data.firstName}`
    );
    $(".user-email >span").text(`${get_owner_account_data.email}`);
    $(".user-portalid >span").text(`${get_owner_account_data.hub_id}`);
    $(".syncdata-log")
      .find("span")
      .text(
        `${get_owner_account_data.email} (HUB ID: ${get_owner_account_data.hub_id})`
      );
    $(".syncdata-log.secondary")
      .find("span")
      .text(`${get_owner_account_data.email}`);
  }
}

/* Calling Default Functions */
searchUrlParams();

let params = getQueryParams();
if (params.hvrif !== null )
{

 getHubSpotAccountDetails();
}
 
function logout() {
  console.log("main")
  Cookies.remove("user");
  location.href = "/";
}

window.addEventListener("load", function () {
  toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: true,
    positionClass: "toast-top-right",
    preventDuplicates: false,
    onclick: null,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "5000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
  };
});

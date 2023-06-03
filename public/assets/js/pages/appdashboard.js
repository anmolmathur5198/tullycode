window.addEventListener("load", function () {
  $(".sideModal").append(
    dynamicBootstrapModal({
      id: "change-dynamics-url",
      modal: "modal modal-full-cont fade",
      dialog: "modal-dialog ",
      title: "Change Dynamics URL",
      body: `  <form id=change-dynamics-url-form">
  <div class="row">
  
  <div class="col-sm-12">
    <div class="alert alert-warning">
      <i class="fa fa-info-circle "></i> Please provide Resource URL to connect another Dynamics Account.
    </div>
  </div>
  
  <div class="col-md-12">
    <div class="form-group">
      <div class="inp-with-icon">
        <input type="text" id="resourceurl" placeholder="Enter Resource URL" class="form-control">
        <i class="fas fa-eye"></i>
      </div>
    </div>
  </div>
  <button type="button" class="btn btn-custom btn-block" onclick="changeResourceURL()">Submit</button>
  
  </div>
  </form>`,
    })
  );
  $("#resourceurl").val($("#hiddenResourceUrl").val());
});

function viewAllUsers() {
  $(".users_row").attr("style", "flex-wrap: wrap");
}
$(".sync-action #switch2").on('change', async function () {
  let  switchStatus = $(this).is(':checked');
  // if ($(this).is(':checked')) {
  //   alert("if",switchStatus);// To verify
  // }
  // else {
  //   alert("else",switchStatus);// To verify
  // }

  let data = await ajaxRequest({
    url: "/api/user/manage-services" + location.search,
    method: "POST",
    body: { syncingStatus: switchStatus },
  });
  console.log("data",data)

  if (data.success) {
    console.log("data2",data.syncing);
    $(".servicesUpdatedlabel").html(data.syncing ? "OFF" : "ON");
    Swal.fire("Services", "Services Settings Updated Successfully", "success");
  } else {
    Swal.fire("Services", "error in updating servidessss", "error");
  }




});

async function changeResourceURL() {
  var resourceurl = $("#resourceurl").val();
  if (!validURL(resourceurl)) return toastr.warning("Please provide valid Dynamics Resource URL");
  let data = await ajaxRequest({
    url: "/api/user/change-resourceurl" + location.search,
    method: "POST",
    body: { resourceurl },
  });

  if (data.success) {
    toastr.success("Resource URL Updated");
    $("#change-dynamics-url").modal("hide");
    location.href = "/api/auth/dynamics365" + location.search;
  } else {
    toastr.error("Resource URL not Updated");
  }
}
function validURL(str) {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
    "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
}


async function toogleHubSageFieldOption(event) {
  console.log("dsf")
  let data = await ajaxRequest({
    url: "/api/user/manage-services" + location.search,
    method: "POST",
    body: { syncingStatus: event.checked },
  });
  if (data.success) {
   // console.log("data1",data.syncing);
    $(".servicesUpdatedlabel").html(data.syncing ? "OFF" : "ON");
    Swal.fire("Services", "Services Settings Updated Successfully", "success");
  } else {
    Swal.fire("Services", "error in updating services", "error");
  }
}





///contact
async function toogleHubSageFieldOptionContact(event) {
  console.log(event.checked);
  let data = await ajaxRequest({
    url: "/api/user/manage-services-contact" + location.search,
    method: "POST",
    body: { syncingStatus: event.checked },
  });
  if (data.success) {
    console.log(data.syncing);
    $(".servicesUpdatedlabel").html(data.syncing ? "OFF" : "ON");
    Swal.fire("Services", "Services Settings Updated Successfully", "success");
  } else {
    Swal.fire("Services", "error in updating services", "error");
  }
}
let switchStatuss = true;
$(".sync-action #switch3").on('change', async function () {
  switchStatuss = $(this).is(':checked');
  // if ($(this).is(':checked')) {
  //   alert(switchStatus);// To verify
  // }
  // else {
  //   alert(switchStatus);// To verify
  // }

  let data = await ajaxRequest({
    url: "/api/user/manage-services-contact" + location.search,
    method: "POST",
    body: { syncingStatus: switchStatuss },
  });
  if (data.success) {
    console.log(data.syncing);
    $(".servicesUpdatedlabel").html(data.syncing ? "OFF" : "ON");
    Swal.fire("Services", "Services Settings Updated Successfully", "success");
  } else {
    Swal.fire("Services", "error in updating servides", "error");
  }




});

///Deal
async function toogleHubSageFieldOptionDeal(event) {
  console.log(event.checked);
  let data = await ajaxRequest({
    url: "/api/user/manage-services-contact" + location.search,
    method: "POST",
    body: { syncingStatus: event.checked },
  });
  if (data.success) {
    console.log(data.syncing);
    $(".servicesUpdatedlabel").html(data.syncing ? "OFF" : "ON");
    Swal.fire("Services", "Services Settings Updated Successfully", "success");
  } else {
    Swal.fire("Services", "error in updating services", "error");
  }
}
let switchStatusss = true;
$(".sync-action #switch4").on('change', async function () {
  switchStatusss = $(this).is(':checked');
  // if ($(this).is(':checked')) {
  //   alert(switchStatus);// To verify
  // }
  // else {
  //   alert(switchStatus);// To verify
  // }

  let data = await ajaxRequest({
    url: "/api/user/manage-services-deal" + location.search,
    method: "POST",
    body: { syncingStatus: switchStatusss },
  });
  if (data.success) {
    console.log(data.syncing);
    $(".servicesUpdatedlabel").html(data.syncing ? "OFF" : "ON");
    Swal.fire("Services", "Services Settings Updated Successfully", "success");
  } else {
    Swal.fire("Services", "error in updating servides", "error");
  }




});
//product
async function toogleHubSageFieldOptionProduct(event) {
  console.log(event.checked);
  let data = await ajaxRequest({
    url: "/api/user/manage-services-product" + location.search,
    method: "POST",
    body: { syncingStatus: event.checked },
  });
  if (data.success) {
    console.log(data.syncing);
    $(".servicesUpdatedlabel").html(data.syncing ? "OFF" : "ON");
    Swal.fire("Services", "Services Settings Updated Successfully", "success");
  } else {
    Swal.fire("Services", "error in updating services", "error");
  }
}
let switchStatussss = true;
$(".sync-action #switch5").on('change', async function () {
  switchStatussss = $(this).is(':checked');
  // if ($(this).is(':checked')) {
  //   alert(switchStatus);// To verify
  // }
  // else {
  //   alert(switchStatus);// To verify
  // }

  let data = await ajaxRequest({
    url: "/api/user/manage-services-product" + location.search,
    method: "POST",
    body: { syncingStatus: switchStatussss },
  });
  if (data.success) {
    console.log(data.syncing);
    $(".servicesUpdatedlabel").html(data.syncing ? "OFF" : "ON");
    Swal.fire("Services", "Services Settings Updated Successfully", "success");
  } else {
    Swal.fire("Services", "error in updating servides", "error");
  }




});
///invoice
async function toogleHubSageFieldOptionInvoice(event) {
  console.log(event.checked);
  let data = await ajaxRequest({
    url: "/api/user/manage-services-invoice" + location.search,
    method: "POST",
    body: { syncingStatus: event.checked },
  });
  if (data.success) {
    console.log(data.syncing);
    $(".servicesUpdatedlabel").html(data.syncing ? "OFF" : "ON");
    Swal.fire("Services", "Services Settings Updated Successfully", "success");
  } else {
    Swal.fire("Services", "error in updating services", "error");
  }
}
let switchStatusssss = true;
$(".sync-action #switch6").on('change', async function () {
  switchStatusssss = $(this).is(':checked');
  // if ($(this).is(':checked')) {
  //   alert(switchStatus);// To verify
  // }
  // else {
  //   alert(switchStatus);// To verify
  // }

  let data = await ajaxRequest({
    url: "/api/user/manage-services-invoice" + location.search,
    method: "POST",
    body: { syncingStatus: switchStatusssss },
  });
  if (data.success) {
    console.log(data.syncing);
    $(".servicesUpdatedlabel").html(data.syncing ? "OFF" : "ON");
    Swal.fire("Services", "Services Settings Updated Successfully", "success");
  } else {
    Swal.fire("Services", "error in updating servides", "error");
  }




});
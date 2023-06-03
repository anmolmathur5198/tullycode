// function showCustomObjectModal(objectId, index) {
//   console.log("sdfdsfdsfds", objectId);
//   $("#customSelectModal").modal("show");
//   $("#objectId").val(objectId);
// }
function deleteObjectIdWithStructute() {
  $(".loading").show();
  let objectId = $("#objectId").val();
  console.log("hello", objectId);

  $("#customSelectModal").modal("hide");

  $.ajax({
    async: false,
    url: "/cobject-open/delete-custom-object-with-structure" + location.search,
    headers: { hapikey: localStorage.hapikey },
    data: { objectId: objectId },
    type: "DELETE",
    success: function (response, status, jqXHR) {
      if (jqXHR.getResponseHeader("content-type").indexOf("text/html") >= 0) {
        location.href = "/";
      }
      showAlertMessage("success", "Data Successfully Deleted");
      $(".loading").hide();
      window.location.href = "/";
    },
    error: function (request, status, error) {
      if (error == "Not Found") {
        $(".loading").hide();
        window.location.href = "/";
      }
      if (request.responseJSON && request.responseJSON.error) {
        $(".loading").hide();
        showAlertMessage("danger", request.responseJSON.error);
        //  alert(request.responseJSON.error);
      }
    },
  });
}
function deleteObjectId() {
  let objectId = $("#objectId").val();
  $("#customSelectModal").modal("hide");
  $(".loading").show();
  $.ajax({
    async: false,
    url: "/cobject-open/delete-custom-object" + location.search,
    data: { objectId: objectId },
    headers: { hapikey: localStorage.hapikey },
    type: "DELETE",
    success: function (response, status, jqXHR) {
      if (jqXHR.getResponseHeader("content-type").indexOf("text/html") >= 0) {
        location.href = "/";
      }
      showAlertMessage("success", "Data Successfully Deleted");
      $(".loading").hide();
      window.location.href = "/";
    },
    error: function (request, status, error) {
      if (error == "Not Found") {
        $(".loading").hide();
        window.location.href = "/";
      }
      if (request.responseJSON && request.responseJSON.error) {
        $(".loading").hide();
        showAlertMessage("danger", request.responseJSON.error);
        // alert(request.responseJSON.error);
      }
    },
  });
}
function showAlertMessage(type, data) {
  $("#showMessage").show();
  $("#showMessage").removeClass();
  $("#showMessage").addClass(`alert alert-${type} alert-dismissible fade show`);
  $("#messge").html(data);
}
function closeAlert() {
  setTimeout(() => {
    $("#showMessage").removeClass("show");
  }, 4000);
}

function htmlTbodyData(data) {
  return data.map((dt, index) => {
    return `<tr>
        <td>
            ${dt.id}
        </td>
        <td>
            ${dt.name}
        </td>
        <td>
            ${dt.fullName}
        </td>
        <td>
            ${dt.createdAt}
        </td>

        <td class="d-flex flex-wrap "> 
        <a id="updateButtonVerify" href="/cobject-open/getSingleCustomSchemasUpdate/${
          dt.fullName + location.search
        }" class="btn color-bg-info btn-pill m-1" >Update</a>
        <a href="/cobject-open/getSingleCustomSchemas/${
          dt.fullName + location.search
        }" class="btn color-bg-info btn-pill m-1">View</a>
           
        </td>
    </tr>`;
  });
}
// function showAssociationModal(objectId, name, fullname) {
//   // $("#addAssociationModal").modal("show");
//   var hapikey = $("#hapikey").val();

//   $("#toCustomObject").empty();
//   $("#fromCustomObject").val(name);
//   $("#fromCustomObject").attr("objectID", objectId);
//   $("#fromCustomObject").attr("fullname", fullname);
//   $.ajax({
//     url: "/cobject-open/getAllSchemaByHapikey" + location.search,
//     headers: { hapikey: hapikey },
//     type: "GET",
//     success: function (response) {
//       if (response.success) {
//         var associatedObjects = [];
//         var filteredAssociations = response.data.filter(
//           (ft) => ft.objectId === objectId
//         )[0].associations;
//         filteredAssociations = filteredAssociations.map(
//           (ft) => ft.fromObjectTypeId
//         );
//         var filtered = response.data.filter((ft) => {
//           if (!filteredAssociations.includes(ft.objectId)) {
//             return ft;
//           } else if (filteredAssociations.includes(ft.objectId)) {
//             associatedObjects.push(ft.name.toUpperCase());
//           }
//         });
//         // var filteredData = filtered.filter((mp) => mp.objectId !== objectId);
//         // console.log({ objectId, filteredData, filtered }, response.data);
//         if (associatedObjects.length > 0) {
//           $("#associatedObjects").html(
//             `<div class="border mb-2"><label class="p-2 fw-bold">Associated Objects</label><p class="text-muted p-2">${associatedObjects.join()}<p> </div>`
//           );
//         }
//         $("#toCustomObject").html(
//           filtered.map(
//             (mp) =>
//               `<option value="${mp.objectId}">${mp.name.toUpperCase()}</option>`
//           )
//         );
//         $("#addAssociationModal").modal("show");
//       } else {
//         showAlertMessage(
//           "danger",
//           response.error ? response.error.message : "Something Went Wrong"
//         );
//         closeAlert();
//       }
//     },
//   });

// }

// function submitAssociateCustomObject() {
//   if (!localStorage.hapikey) {
//     return showAlertMessage("danger", "Hapikey Not Found");
//   }
//   if ($("#fromCustomObject").attr("objectID") == "") {
//     return showAlertMessage("info", "From Object ID Missing");
//   }
//   var associatedObjectBody = {
//     fromObjectTypeId: $("#fromCustomObject").attr("objectID"),
//     toObjectTypeId: $("#toCustomObject").val(),
//     name: `${$("#fromCustomObject").val().toLowerCase()}_to_${$(
//       "#toCustomObject"
//     )
//       .text()
//       .toLowerCase()}"`,
//     cardinality: "ONE_TO_MANY",
//     inverseCardinality: "ONE_TO_MANY",
//   };
//   console.log(associatedObjectBody);
//   var customObjectId = $("#fromCustomObject").attr("fullname");
//   $.ajax({
//     url: "/cobject-open/submit-newAssociateObject/" + customObjectId + location.search,
//     headers: { hapikey: localStorage.hapikey },
//     type: "POST",
//     data: { data: JSON.stringify(associatedObjectBody) },
//     dataType: "json",
//     success: function (response) {
//       if (response.success) {
//         showAlertMessage("success", "Object Successfully Associated");
//         $("#addAssociationModal").modal("hide");
//         closeAlert();
//       } else {
//         $("#addAssociationModal").modal("hide");
//         showAlertMessage(
//           "danger",
//           response.error ? response.error.message : "Something Went Wrong"
//         );

//       }
//     },
//   });
// }
// gaii = Get Authentication Query Item
function showGetAllSchemaData() {
  var hapikey = $("#hapikey").val();
  $(".loading").show();
  if (hapikey != "" || hapikey != undefined) {
    $.ajax({
      url: "/cobject-open/getAllSchemaByHapikey" + location.search,
      headers: { hapikey: hapikey },
      type: "GET",
      success: function (response, status, jqXHR) {
        if (jqXHR.getResponseHeader("content-type").indexOf("text/html") >= 0) {
          location.href = "/";
        }
        if (response.success) {
          $("#table-body").html(htmlTbodyData(response.data));
          $(".no_of_custom_object").html(response.data.length);
        } else {
          showAlertMessage(
            "danger",
            response.error ? response.error : "Something Went Wrong"
          );
          $("#norecords").css("display", "block");
          closeAlert();
        }
        $(".loading").hide();
      },
    });
  }
}
async function searchCustomObjectDataByHapiKey() {
  var hapikey = $("#hapikey").val();
  $(".loading").show();
  if (hapikey == "" || hapikey == undefined) {
    localStorage.clear();
    $("#table-body").html("");
    $("#norecords").css("display", "block");
    showAlertMessage("info", "HubSpot API key must not Be empty");
    $(".loading").hide();
    closeAlert();
    return;
  } else {
    let verifyHapikey = await validateHapiKey(hapikey);
    console.log(verifyHapikey);
    if (verifyHapikey.success) {
      localStorage.setItem("hapikey", hapikey);
      $("#norecords").css("display", "none");
      showGetAllSchemaData();
      showAlertMessage("success", verifyHapikey.data);
      window.location.reload();
    } else {
      showAlertMessage("danger", verifyHapikey.error);
    }
    $(".loading").hide();
  }
}
$(".addCustomObjectButton").hide();
$("#updateButtonVerify").hide();
$("#hapikey").val(localStorage.hapikey);
if (localStorage.getItem("hapikey")) {
  $("#hapikey").val(localStorage.hapikey);
  $(".addCustomObjectButton").show();
  // document.getElementsByClassName("updateButtonVerify").style.display = "block";
  $("#updateButtonVerify").show();
  // $("#updateButtonVerify").css("display", "inline-block");
}
showGetAllSchemaData();
function addCustomObjectForm() {
  if ($("#hapikey").val() == "")
    return showAlertMessage("info", "Please provide HubSpot API key");
  if (localStorage.hapikey && localStorage.hapikey !== "") {
    if (Number($(".no_of_custom_object").html()) === 10) {
      return showAlertMessage(
        "warning",
        "You can Create Upto 10 Custom Objects Only"
      );
    } else {
      return (location.href =
        "/cobject-open/add-custom-object-class" + location.search);
    }
  } else return showAlertMessage("warning", "Please Provide HapiKey");
}

// Validate HapiKey
async function validateHapiKey(hapikey) {
  let hapi = await fetch(
    "/cobject-api/verify-hapikey" + location.search + "&hapikey=" + hapikey,
    {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
    }
  );
  hapi = await hapi.json();
  return hapi;
}

// Adding Custom Property
var customPropertydata = (length) => `
<div class="d-flex p-2 border m-2 flex-wrap justify-content-between align-items-baseline align-items-center mainCustomPropertyContainer currentCP-${length}">
    <div class="p-1">
        <input type="text" onChange="onChangeCustomInputValues(this)" disabled name="propertylabel-${length}" id="propertylabel-${length}" property placeholder="Type Property Label" class="form-control form-control-sm" required>
        <div class="invalid-feedback">
            Please provide a Property Name.
        </div>
    </div>
    <div class="">
    <div class="input-group">
    <select property name="propertytype-${length}" disabled select-data-id="${length}" id="propertytype-${length}" onChange="selectEnumeration(this)" class="form-select form-select-sm customSelectOptionForModal px-2" aria-label="Default select example">
        <option data-bs-toggle="tooltip" data-bs-placement="top" title="A plain text string, displayed in a single line text input." value="text">Text</option>
        <option data-bs-toggle="tooltip" data-bs-placement="top" title="A plain text string, displayed as a multi-line text input." value="textarea">TextArea</option>
        <option data-bs-toggle="tooltip" data-bs-placement="top" title="Allows for a file to be uploaded to a form. Stored and displayed as a URL link to the file." value="file">File</option>
        <option data-bs-toggle="tooltip" data-bs-placement="top" title="A date value, displayed as a date picker." value="date">Date</option>
        <option data-bs-toggle="tooltip" data-bs-placement="top" title="An ISO 8601 formatted value representing a specific day, month, year and time of day. The HubSpot app will not display the time of day." value="dateTime">DateTime</option>
        <option data-bs-toggle="tooltip" data-bs-placement="top" title="A string of numerals or numbers written in decimal or scientific notation." value="number">Number</option>
        <option data-bs-toggle="tooltip" data-bs-placement="top" title="A dropdown input that will allow users to select one of a set of options allowed for the property." value="select">Select</option>
        <option data-bs-toggle="tooltip" data-bs-placement="top" title="An input that will allow users to select one of either Yes or No. When used in a form, it will be displayed as a single checkbox." value="booleancheckbox">Booleancheckbox</option>
        <option data-bs-toggle="tooltip" data-bs-placement="top" title="A list of checkboxes that will allow a user to select multiple options from a set of options allowed for the property." value="checkbox">Checkbox</option>
        <option data-bs-toggle="tooltip" data-bs-placement="top" title="An input that will allow users to select one of a set of options allowed for the property. When used in a form, this will be displayed as a set of radio buttons." value="radio">Radio</option>
    </select>
    <span role="button" class="input-group-text checkIfSelect" style="display:none;" onClick="openCustomSelectModal(${length})" ><i class="fa fa-eye" aria-hidden="true"></i></span>
      </div> 
    </div>
    <div class="form-check form-switch">
        <input onChange="onChangeCustomInputValues(this)" name="propertyisRequired-${length}" id="propertyisRequired-${length}" property class="form-check-input" type="checkbox" id="isRequired">
        <label class="form-check-label" for="isRequired">isRequired</label>
    </div>
    <div class="form-check form-switch">
    <input onChange="onChangeCustomInputValues(this)" name="propertyisprimaryDisplayProperty-${length}" id="propertyisprimaryDisplayProperty-${length}" property class="form-check-input primaryDisplayProperty" type="checkbox" id="isRequired">
    <label class="form-check-label" for="isRequired">isPrimaryDisplay</label>
</div>    
    <div class="form-check form-switch">
        <input onChange="onChangeCustomInputValues(this)" name="propertyisSecondayDisplay-${length}" id="propertyisSecondayDisplay-${length}" property class="form-check-input secondaryDisplayProperty" type="checkbox" id="isSecondaryDisplay">
        <label class="form-check-label" for="isSecondaryDisplay">isSecondaryDisplay</label>
    </div> 
     
     <div class="form-check form-switch">
        <input onChange="onChangeCustomInputValues(this)" name="propertyisSearchable-${length}" id="propertyisSearchable-${length}" property class="form-check-input" type="checkbox" id="isSearchable">
        <label class="form-check-label" for="isSearchable">isSearchable</label>
    </div>
    <div>
         <button class="btn btn-danger" style="display: none;" disabled removeRow="${length}" onClick="deleteCustomProperty(this)"><i class="fas fa-times"></i></button>
    </div>
    
</div>`;

function addCustomProperty() {
  var lengthOfProperty = $("#customObjectFormProperty").children(
    ".mainCustomPropertyContainer"
  ).length;
  $("#customObjectFormProperty").append(customPropertydata(lengthOfProperty));
  var selectOptionChecks = $(".checkIfSelect");
  selectOptionChecks.each(function () {
    if ($(this).is(":visible")) {
      $(this).show();
    } else {
      $(this).hide();
    }

    // console.log("dtsdf", $(this).css("display"), $(this).prop("style"));
  });
}

// Select Enumerations
function selectEnumeration(event) {
  // Changing Form Values
  onChangeCustomInputValues(event);
  var option = $(event).val();
  //   console.log("eve", option);
  var options = ["select", "booleancheckbox", "checkbox", "radio", "select"];
  if (options.includes(option)) {
    $(event).siblings(".checkIfSelect").show();
    // $(".checkIfSelect").show();
    // $("#customSelectModal").modal("show");
  } else {
    $(event).siblings(".checkIfSelect").hide();
    // $(".checkIfSelect").hide();
  }
}

//Changing Select Options and Opening Modal
$(document).on("change", ".customSelectOptionForModal", function () {
  var id = $(this).attr("select-data-id");
  var options = ["select", "booleancheckbox", "checkbox", "radio", "select"];
  if (options.includes($(this).val())) {
    $("#modalSelectOptionId").val(id);
    openCustomSelectModal(id);
  }
});

var enumerationSelectData = (length) => `
<div class="d-flex flex-wrap justify-content-around border p-1 m-2 mainEnumerationOptionsContainer currentCEP-${length}">
<div class="p-2">
  <input disabled childPropertyOfSelect onChange="onChangeCustomInputValues(this)" name="propertychildlabel-${length}" id="propertychildlabel-${length}" type="text" placeholder="Type Property Label" class="form-control form-control-sm" required>
  <div class="invalid-feedback">
      Please provide a Property Name.
  </div>
</div>
<div class="p-2">
  <input disabled childPropertyOfSelect onChange="onChangeCustomInputValues(this)" name="propertychildvalue-${length}" id="propertychildvalue-${length}" type="text" placeholder="Type Property Value" class="form-control form-control-sm" required>
  <div class="invalid-feedback">
      Please provide a Property Name.
  </div>
</div>
   
</div>`;

function addEnumerationOptions() {
  // CEP Custom Enumeration Property
  var lengthOfProperty = $("#EnumerationOptionsContainer").children(
    ".mainEnumerationOptionsContainer"
  ).length;
  $("#EnumerationOptionsContainer").append(
    enumerationSelectData(lengthOfProperty)
  );
}
function deleteCustomEnumerationProperty(event) {
  var row = $(event).attr("removeRow");
  var parentId = $("#modalSelectOptionId").val();
  var data = JSON.parse(localStorage.getItem("customObjectUpdateDetailData"));
  data["properties"][parentId].options.splice(row, 1);
  localStorage.setItem("customObjectUpdateDetailData", JSON.stringify(data));
  $(event).parents(".mainEnumerationOptionsContainer").remove();
}
$("#customSelectModal").on("hidden.bs.modal", function () {
  console.log("modalClodseEventFiresd");
  $("#EnumerationOptionsContainer").empty();
});
// Open Custom Select Modal
function openCustomSelectModal(id) {
  $("#EnumerationOptionsContainer").empty();
  $("#modalSelectOptionId").val(id);
  if (
    localStorage.customObjectUpdateDetailData !== undefined &&
    Object.keys(
      JSON.parse(localStorage.getItem("customObjectUpdateDetailData"))
    ).length > 0
  ) {
    var data = JSON.parse(localStorage.getItem("customObjectUpdateDetailData"));
    console.log("fff", data);
    if (data.properties.length > 0) {
      if (data.properties[id].options.length === 0) {
        console.log("nooptions");
        $("#EnumerationOptionsContainer").empty();
        return alert("No Options Found");
      } else {
        console.log("yesoptions");
        data.properties[id].options.map((vl, i) => {
          console.log("preo/p", vl);
          $("#EnumerationOptionsContainer").append(enumerationSelectData(i));
          Object.entries(vl).map(([okey, ovalue]) => {
            var strings = okey.split("-");
            console.log({ okey, ovalue });
            $(`#${strings[0]}-${i}`).val(ovalue);
          });
        });
        $("#customSelectModal").modal("show");
      }
    }
  }
}

// Deleting Custom Property
function deleteCustomProperty(event) {
  var row = $(event).attr("removeRow");
  var data = JSON.parse(localStorage.getItem("customObjectUpdateDetailData"));
  data["properties"].splice(row, 1);
  localStorage.setItem("customObjectUpdateDetailData", JSON.stringify(data));
  //   console.log(data);
  $(event).parents(".mainCustomPropertyContainer").remove();
}

// Updating Properties
$(".singularplurallabels").hide();
$("#customObjectName").on("keyup", function () {
  var val = $(this).val();
  console.log({ val });
  $("#singularName").val(val);
  $("#pluralName").val(pluralize(val));
  $(".singularplurallabels").show();
  if ($(this).val() == "") $(".singularplurallabels").hide();
  onChangeCustomInputValues(this);
});

// Showing Alert Messages
function showAlertMessage(type, data) {
  $("#showMessage").show();
  $("#showMessage").removeClass();
  $("#showMessage").addClass(`alert alert-${type} alert-dismissible fade show`);
  $("#showMessage > strong").html(data);
}
$("#showMessage").hide();

// Form Submission using UI
$("#submitCustomObjectFormData").on("click", function (event) {
  event.preventDefault();
  var pathname = $(this).attr("pathname");
  // var data = $("form").serializeArray();
  // console.log("daddd", data);

  var submitDataFormat = convertLocalDataToHubspotRequestData();
  var updateObjectIdDetails = $("#updateCustomObjectIdData").val();
  // console.log(JSON.parse(updateObjectIdDetails).labels, submitDataFormat.labels);
  let singularName = JSON.parse(updateObjectIdDetails).labels.singular;
  let pluralName = JSON.parse(updateObjectIdDetails).labels.plural;
  if (
    !submitDataFormat.primaryDisplayProperty ||
    submitDataFormat.primaryDisplayProperty == ""
  ) {
    return alert("Primary Display Property Must Not be Empty");
  }
  if (
    singularName === submitDataFormat.labels.singular &&
    pluralName == submitDataFormat.labels.plural
  ) {
    delete submitDataFormat.labels;
  } else if (singularName === submitDataFormat.labels.singular) {
    delete submitDataFormat.labels.singular;
  } else if (pluralName == submitDataFormat.labels.plural) {
    delete submitDataFormat.labels.plural;
  }
  $(".loading").show();
  $(window).scrollTop(0);
  // Finally Submitting the Data to the Hubspot Server
  $.ajax({
    url: `/cobject-open/submit-updateformdata/${pathname}` + location.search,
    headers: { hapikey: localStorage.hapikey },
    data: { data: JSON.stringify(submitDataFormat) },
    type: "POST",
    success: function (data, status, jqXHR) {
      if (jqXHR.getResponseHeader("content-type").indexOf("text/html") >= 0) {
        location.href = "/";
      }
      if (data.success) {
        $(".loading").hide();
        showAlertMessage("success", "Data Successfully Updated");
        location.href = "/cobject-open/hco" + location.search;
      } else {
        $(".loading").hide();
        showAlertMessage("danger", data.error.message);
      }
      // console.log('eeeeeeee',{ data, success,status });
    },
  });
  // console.log("ssubmitDataFormat", submitDataFormat);
  // return false;
});

//On Changing Input Values Saving them to LocalStorage
function onChangeCustomInputValues(event) {
  console.log("event", event);

  var data = { properties: [] };
  if (localStorage.customObjectUpdateDetailData !== undefined) {
    data = {
      ...data,
      ...JSON.parse(localStorage.getItem("customObjectUpdateDetailData")),
    };
  }
  console.log({ asaaaaaaaaaaaa: data });
  if (event.name === "customObjectName") {
    data["customObjectName"] = event.value;
    data["singularName"] = event.value;
    data["pluralName"] = pluralize(event.value);
  } else if (event.name === "associatedObjects") {
    data["associatedObjects"] = $(event).val();
  } else {
    var propertyAttribute = $(event).attr("property");
    var childPropertyAttribute = $(event).attr("childPropertyOfSelect");
    console.log({ propertyAttribute, childPropertyAttribute });
    if (
      typeof propertyAttribute !== typeof undefined &&
      propertyAttribute !== false
    ) {
      var strings = event.name.split("-");
      console.log({ strings, data });
      if (event.name.includes("-")) {
        if (data["properties"][strings[1]] == undefined) {
          data["properties"].push({
            options: [],
            [strings[0]]:
              event.type === "checkbox" ? $(event).is(":checked") : event.value,
          });
        } else {
          data["properties"][strings[1]][strings[0]] =
            event.type === "checkbox" ? $(event).is(":checked") : event.value;
        }

        if ($(event).hasClass("primaryDisplayProperty")) {
          $(".primaryDisplayProperty").each(function (i, obj) {
            if (strings[1] == i) {
              console.log(
                "aaaaa",
                { i, ssd: typeof i, strings },
                data["properties"],
                [strings[1]],
                [strings[0]]
              );
              $(`#propertyisprimaryDisplayProperty-${i}`).prop("checked", true);
              data["properties"][i][strings[0]] = $(event).is(":checked");
              if ($(event).is(":checked")) {
                $(`#propertyisSecondayDisplay-${i}`).prop("checked", false);
                // $(`#propertyisSecondayDisplay-${i}`).prop("disabled", true);
                data["properties"][i]["propertyisSecondayDisplay"] = false;
              }
            } else {
              console.log(
                "bbbbb",
                { i, strings },
                data["properties"],
                [strings[1]],
                [strings[0]]
              );
              $(`#propertyisprimaryDisplayProperty-${i}`).prop(
                "checked",
                false
              );
              // $(`#propertyisSecondayDisplay-${i}`).prop("disabled", false);
              data["properties"][i][strings[0]] = !$(event).is(":checked");
            }
          });
        }
        // For Secondary Property
        if ($(event).hasClass("secondaryDisplayProperty")) {
          $(".secondaryDisplayProperty").each(function (i, obj) {
            if (strings[1] == i) {
              $(`#propertyisSecondayDisplay-${i}`).prop("checked", true);
              data["properties"][i][strings[0]] = $(event).is(":checked");
              if ($(event).is(":checked")) {
                $(`#propertyisprimaryDisplayProperty-${i}`).prop(
                  "checked",
                  false
                );
                // $(`#propertyisprimaryDisplayProperty-${i}`).prop("disabled", true);
                data["properties"][i][
                  "propertyisprimaryDisplayProperty"
                ] = false;
              }
            } else {
              // $(`#propertyisprimaryDisplayProperty-${i}`).prop("checked", false);
              // $(`#propertyisSecondayDisplay-${i}`).prop("disabled", false);
              // data["properties"][i][strings[0]] = !$(event).is(":checked");
            }
          });
        }
        console.log("sssss", data);
      }
    } else if (
      typeof childPropertyAttribute !== typeof undefined &&
      childPropertyAttribute !== false
    ) {
      var strings = event.name.split("-");
      var parentSelectIndex = $("#modalSelectOptionId").val();
      console.log("parerrrr", parentSelectIndex, strings);
      if (event.name.includes("-")) {
        if (
          (data["properties"][parentSelectIndex] !== undefined &&
            parentSelectIndex !== undefined) ||
          parentSelectIndex !== ""
        ) {
          if (
            data["properties"][parentSelectIndex]["options"][strings[1]] ==
            undefined
          ) {
            data["properties"][parentSelectIndex]["options"].push({
              [strings[0]]: event.value,
            });
          } else {
            data["properties"][parentSelectIndex]["options"][strings[1]][
              strings[0]
            ] = event.value;
          }
        }
        console.dir("kefidt", data);
      }
    } else {
      data[event.name] = event.value;
    }
  }

  localStorage.setItem("customObjectUpdateDetailData", JSON.stringify(data));
  ViewJsonFormatData();
  console.log("data", data);
}

var updateObjectIdDetails = $("#updateCustomObjectIdData").val(); //play store data

if (Object.keys(JSON.parse(updateObjectIdDetails)).length > 0) {
  var updateCustomDataForm = { associatedObjects: [], properties: [] };
  var updateObjectIdDetailsData = JSON.parse(updateObjectIdDetails);
  updateCustomDataForm["customObjectName"] = updateObjectIdDetailsData.name;
  updateCustomDataForm["singularName"] =
    updateObjectIdDetailsData.labels.singular;
  updateCustomDataForm["pluralName"] = updateObjectIdDetailsData.labels.plural;
  if (updateObjectIdDetailsData.associations.length > 0) {
    updateObjectIdDetailsData.associations.forEach((as) => {
      updateCustomDataForm["associatedObjects"].push(as.fromObjectTypeId);
    });
  }
  updateObjectIdDetailsData.properties.map((pr, i) => {
    updateCustomDataForm["properties"].push({
      ["propertylabel"]: pr.name,
      ["propertytype"]: pr.fieldType,
      ["propertyisRequired"]: updateObjectIdDetailsData.requiredProperties.includes(
        pr.name
      ),
      ["propertyisprimaryDisplayProperty"]: updateObjectIdDetailsData.primaryDisplayProperty.includes(
        pr.name
      ),
      ["propertyisSecondayDisplay"]: updateObjectIdDetailsData.secondaryDisplayProperties.includes(
        pr.name
      ),
      ["propertyisSearchable"]: updateObjectIdDetailsData.searchableProperties.includes(
        pr.name
      ),
      options: [],
    });
    if (pr.options.length > 0) {
      pr.options.forEach((fr, k) => {
        updateCustomDataForm["properties"][i]["options"].push({
          ["propertychildlabel"]: fr.label,
          ["propertychildvalue"]: fr.value,
        });
      });
    }
  });
  console.log("check new dtata", updateCustomDataForm);
  localStorage.setItem(
    "customObjectUpdateDetailData",
    JSON.stringify(updateCustomDataForm)
  );
} //ens object
console.log("udpateObje", JSON.parse(updateObjectIdDetails));
if (
  localStorage.customObjectUpdateDetailData !== undefined &&
  Object.keys(JSON.parse(localStorage.getItem("customObjectUpdateDetailData")))
    .length > 0
) {
  var data = JSON.parse(localStorage.getItem("customObjectUpdateDetailData"));
  Object.entries(data).map(([key, value]) => {
    $(`#${key}`).val(value);
    if (key === "customObjectName") {
      $(".singularplurallabels").show();
    }
    // console.log({ key, value });
    if (key === "properties") {
      if (value.length > 0) {
        // console.log({ key, value });
        value.map((mp, i) => {
          //   console.log({ mp, i });
          if (
            mp.propertylabel == "hs_all_accessible_team_ids" ||
            mp.propertylabel == "hs_created_by_user_id" ||
            mp.propertylabel == "hs_createdate" ||
            mp.propertylabel == "hs_lastmodifieddate" ||
            mp.propertylabel == "hs_merged_object_ids" ||
            mp.propertylabel == "hs_object_id" ||
            mp.propertylabel == "hs_updated_by_user_id" ||
            mp.propertylabel == "hs_user_ids_of_all_owners"
          ) {
            console.log;
          } else {
            $("#customObjectFormProperty").append(customPropertydata(i));
            Object.entries(mp).map(([key1, value1]) => {
              var strings = key1.split("-");
              var options = [
                "select",
                "booleancheckbox",
                "checkbox",
                "radio",
                "select",
              ];
              // console.log({ key1, value1 });
              if (typeof value1 == "boolean") {
                if (value1) {
                  $(`#${strings[0]}-${i}`).prop("checked", true);
                }
              } else if (options.includes(value1)) {
                $(`#${strings[0]}-${i}`).siblings(".checkIfSelect").show();
                $(`#${strings[0]}-${i}`).val(value1);
              } else {
                $(`#${strings[0]}-${i}`).val(value1);
              }
            });
          }
        });
      }
    }
  });
}

// Converting LocalStorage Data to Hubspot RequestData
function convertLocalDataToHubspotRequestData() {
  var submitDataFormat = {
    labels: {},
    secondaryDisplayProperties: [],
    searchableProperties: [],
    requiredProperties: [],
    properties: [],
  };
  var data = {};
  if (localStorage.customObjectUpdateDetailData !== undefined) {
    data = JSON.parse(localStorage.getItem("customObjectUpdateDetailData"));
  }
  console.log(
    "dsfds",
    data,
    localStorage.getItem("customObjectUpdateDetailData")
  );
  const checkForType = (type) => {
    if (type == "file" || type == "text" || type == "textarea") {
      return "string";
    } else if (type == "dateTime" || type == "data") {
      return "data";
    } else if (type == "number") {
      return "number";
    } else if (
      type == "checkbox" ||
      type == "booleancheckbox" ||
      type == "radio" ||
      type == "select"
    ) {
      return "enumeration";
    }
  };
  var options = ["select", "booleancheckbox", "checkbox", "radio", "select"];
  submitDataFormat["name"] = data.singularName
    ? data.singularName.replace(/ /g, "_")
    : null;
  submitDataFormat["labels"]["singular"] = data.singularName;
  submitDataFormat["labels"]["plural"] = data.pluralName;
  submitDataFormat["associatedObjects"] = data.associatedObjects;

  data.properties.map((ds) => {
    Object.entries(ds).map(([key, val]) => {
      if (typeof val === "boolean" && val) {
        if (key.includes("isRequired")) {
          submitDataFormat.requiredProperties.push(ds.propertylabel);
        } else if (key.includes("isSearchable")) {
          submitDataFormat.searchableProperties.push(ds.propertylabel);
        } else if (key.includes("isSecondayDisplay")) {
          submitDataFormat.secondaryDisplayProperties.push(ds.propertylabel);
        } else if (key.includes("isprimaryDisplayProperty")) {
          if (val) {
            submitDataFormat["primaryDisplayProperty"] = ds.propertylabel;
          }
        }
      }
    });
  });
  data.properties.map((ds) => {
    if (options.includes(ds.propertytype)) {
      var optionsData = [];
      if (ds.options.length) {
        ds.options.map((ol) =>
          optionsData.push({
            label: ol.propertychildlabel,
            value: ol.propertychildvalue,
          })
        );
        submitDataFormat["properties"].push({
          name: ds.propertylabel ? ds.propertylabel.replace(/ /g, "_") : null,
          label: ds.propertylabel
            ? ds.propertylabel.replace(/(\w)(\w*)/g, function (g0, g1, g2) {
                return g1.toUpperCase() + g2.toLowerCase();
              })
            : null,
          type: checkForType(ds.propertytype),
          fieldType: ds.propertytype,
          options: optionsData,
        });
      }
    } else {
      submitDataFormat["properties"].push({
        name: ds.propertylabel ? ds.propertylabel.replace(/ /g, "_") : null,
        label: ds.propertylabel
          ? ds.propertylabel.replace(/(\w)(\w*)/g, function (g0, g1, g2) {
              return g1.toUpperCase() + g2.toLowerCase();
            })
          : null,
        type: checkForType(ds.propertytype),
        fieldType: ds.propertytype,
      });
    }
  });
  return submitDataFormat;
}

function ViewJsonFormatData() {
  var data = convertLocalDataToHubspotRequestData();
  var htmldata = `<pre class="prettyprint convertToJson"><code>${JSON.stringify(
    data,
    undefined,
    5
  )}</code><pre>`;
  // $("#jsonformatData").html(JSON.stringify(data, undefined, 4));
  $("#jsonformatData").html(htmldata);
  // CodeMirror.fromTextArea(document.getElementById("jsonformatData"), {
  //   lineNumbers: true,
  //   matchBrackets: true,
  //   mode: "javascript",
  //   theme: "3024-night",
  //   lineWrapping: false,
  //   readOnly: true,
  // });
}
function closeAlert() {
  $("#showMessage").removeClass("show");
  $("#showMessage").hide();
}
ViewJsonFormatData();

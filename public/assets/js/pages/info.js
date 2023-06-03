window.addEventListener("load", function () {
    /* Rendering All Saved Options for the User */
    renderOptionsofhubsage();
    /* End Rendering */
    let toogleHubSageFieldOptions = {};
    toogleHubSageFieldOptions["transferFrom"] = $(
      'input[name="transferFrom"]:checked'
    ).val();
    $("#sagemainstore").val(
      JSON.stringify({
        ...toogleHubSageFieldOptions,
        ...JSON.parse($("#sagemainstore").val()),
      })
    );
    // console.log("ssttore", JSON.parse($("#sagemainstore").val()));
  });
  function modifysagemainstore(data) {
    var store = JSON.parse($("#sagemainstore").val());
  
    store[data.name] = data.value;
    $("#sagemainstore").val(JSON.stringify(store));
    console.log({ store });
    // console.log(store[data.name], data.name);
  }
  function checkForAllowedFieldsInSageOptions(store, value) {
    if (store.hubSageFields.length > 0) {
      let fields = [];
      console.log({ hubsage: store.hubSageFields });
      store.hubSageFields.map((mp) => {
        fields.push(mp.sage);
      });
      $(".sage_custom_field option").each(function () {
        // Add $(this).val() to your list
        if (fields.includes($(this).val())) {
          $(`.sage_custom_field option[value="${$(this).val()}"]`).attr(
            "disabled",
            true
          );
        } else {
          $(`.sage_custom_field option[value="${$(this).val()}"]`).attr(
            "disabled",
            false
          );
        }
      });
    }
  }
  function selectCustomMappingField(event, type, index) {
    var store = JSON.parse($("#sagemainstore").val());
    let checkVal = store.hubSageFields.filter((fp) => fp[type] == event.value);
    console.log(
      event.value,
      "****",
      type,
      "***",
      index,
      "***",
      checkVal,
      "****",
      $(event).val()
    );
    if (!event.value.includes("Choose")) {
      if (type == "sage") {
        if (checkVal.length == 0) {
          if (store.hubSageFields[index]) {
            store.hubSageFields[index][type] = event.value;
          } else {
            store.hubSageFields.push({ [type]: event.value });
          }
          // $(`.sage_custom_field option[value="${event.value}"]`).remove();
          checkForAllowedFieldsInSageOptions(store, event.value);
        } else {
          if (store.hubSageFields[index]) {
            store.hubSageFields[index][type] = event.value;
            checkForAllowedFieldsInSageOptions(store, event.value);
          }
        }
      } else {
        console.log({ [type]: event.value });
        if (checkVal.length == 0) {
          if (store.hubSageFields[index]) {
            store.hubSageFields[index][type] = event.value;
          } else {
            store.hubSageFields.push({ [type]: event.value });
          }
        } else {
          if (store.hubSageFields[index]) {
            store.hubSageFields[index][type] = event.value;
          }
        }
      }
    }
  
    // alert(event.value + "******" + type);
    if (store.hubSageFields.length > 0)
      modifysagemainstore({ name: "hubSageFields", value: store.hubSageFields });
  }
  
  function add_custom_field_options() {
    var hubspot_options = JSON.parse($("#hubspot_options").val());
    var sage_options = JSON.parse($("#sage_options").val());
    var total_child_options = $(".custom_fields").find(".row").length;
    var custom_field_html = `<div class="row mb-2">
          <div class="col-lg-4">
             <div class="input-group mb-2">
             <div class="input-group-prepend">
                    <div class="input-group-text"> <img src="/assets/img/crm3.png" alt=""></div>
                  </div>
              <select onchange="selectCustomMappingField(this,'hub',${total_child_options})" class="form-control custom-select bg-white p-3 hub_custom_field" name="hub_custom_field_${total_child_options}" id="hub_custom_field_${total_child_options}">
                <option selected disabled>Choose HubSpot Mapping</option>
               ${hubspot_options.map((fr) => {
                 return `<option class="text-capitalize" value="${fr}">${fr
                   .replace(/(?:_| |\b)(\w)/g, function (fr, p1) {
                     return " " + p1.toUpperCase();
                   })
                   .replace(/([-\?])(.)/g, function (w) {
                     return w.toUpperCase().trim();
                   })}</option>`;
               })}
              </select>
            </div>
          </div>
           <!-- <div class=" col-lg-1 text-center mt-2"><img src="/assets/img/direc.png" alt=""></div> -->
          <div class="col-lg-4">
             <div class="input-group mb-2">
              <select onchange="selectCustomMappingField(this,'sage',${total_child_options})" class="form-control custom-select bg-white p-3 sage_custom_field" name="sage_custom_field_${total_child_options}" id="sage_custom_field_${total_child_options}">
                <option selected disabled>Choose Dynamic365 Mapping</option>
                ${sage_options.map((fr) => {
                  var store = JSON.parse(
                    $("#sagemainstore").val()
                  ).hubSageFields;
                  let fields = [];
                  store.map((mp) => fields.push(mp.sage));
                  if (fields.includes(fr)) {
                    return `<option disabled class="text-capitalize" value="${fr}">${fr
                      .replace(/(?:_| |\b)(\w)/g, function (fr, p1) {
                        return " " + p1.toUpperCase();
                      })
                      .replace(/([-\?])(.)/g, function (w) {
                        return w.toUpperCase().trim();
                      })}</option>`;
                  } else {
                    return `<option class="text-capitalize" value="${fr}">${fr
                      .replace(/(?:_| |\b)(\w)/g, function (fr, p1) {
                        return " " + p1.toUpperCase();
                      })
                      .replace(/([-\?])(.)/g, function (w) {
                        return w.toUpperCase().trim();
                      })}</option>`;
                  }
                })}
              </select>
               <div class="input-group-append">
                    <div class="input-group-text"><img src="/assets/img/crm2.png" alt=""></div>
                  </div>
            </div>
          </div>
          <div class="col-md-2">
        <select onchange="selectCustomMappingField(this,'preference',${total_child_options})" class="form-control custom-select bg-white p-3 preference_custom_field" name="preference_custom_field_${total_child_options}" id="preference_custom_field_${total_child_options}">
          <option selected disabled>Choose Preference</option>
          <option value="1">Bidirectional</option>
          <option value="2">Preference HubSpot</option>
          <option value="3">Preference Mercury</option>
        </select>
        </div>
          <div class="col-md-1">
              <i class="fa fa-times text-danger mt-2" onclick="remove_custom_field(this,${total_child_options})"style="font-size: 1.5rem;cursor:pointer"></i>
          </div>
        </div>`;
    $(".custom_fields").append(custom_field_html);
    
    //  $(".select2Apply").select2();
  }
  
  function transferFrom(event) {
    var value = $(event).val();
    modifysagemainstore({ name: "transferFrom", value });
  }
  
  function toogleHubSageFieldOption(event, data) {
    data = JSON.parse(data);
    console.log({ eeee: event.checked });
    // $(event).prop("checked", event.checked);
    modifysagemainstore({
      name: data.hub + "_" + data.sage,
      value: event.checked,
    });
  }
  function remove_custom_field(event, index) {
    Swal.fire({
      title: "Remove",
      text: "Are you sure to removed mapped field",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, remove it!",
    }).then((result) => {
      if (result.isConfirmed) {
        var store = JSON.parse($("#sagemainstore").val());
        store.hubSageFields.splice(index, 1);
        $(event).parents(".row").remove();
        $("#sagemainstore").val(JSON.stringify({ ...store }));
        toastr.success("Mapped field is removed");
        saveDynamicOptionChanges();
      }
    });
  }
  
  async function saveDynamicOptionChanges() {
    var store = JSON.parse($("#sagemainstore").val());
    console.log({ store });
    let error = false;
  await Promise.all(
    store.hubSageFields.map((mp) => {
      if (!mp.preference) {
        toastr.warning("Preference must be defined for " + mp.hub);
        return false;
      } else {
        return true;
      }
    })
  ).then((data) => {
    console.log(data.toString(), /false/gi.test(data.toString()));
    if (/false/gi.test(data.toString())) error = true;
  });

  if (error) return;
    let response = await ajaxRequest({
      url: "/saveinfomapping" + location.search,
      method: "POST",
      body: store,
    });
    if (response.success) {
      toastr.success(response.data);
    } else {
      toastr.error(
        typeof response.error == "string"
          ? response.error
          : "Saving HubSpot options failed"
      );
    }
  }
  async function callSyncingRequest(query) {
    let url = "/api/start-syncing" + location.search;
    if (query) {
      if (query.hubspotafter !== 0) {
        url = url + "&hubspotafter=" + query.hubspotafter;
      } else if (query.hubspotafter == 0) {
        url = url + "&success=true";
      }
      if (query.startPosition !== 0) {
        url = url + "&startPosition=" + query.startPosition;
      } else if (query.startPosition == 0) {
        url = url + "&qbsuccess=true";
      }
    }
    console.log({ url });
    let data = await ajaxRequest({
      url: url,
      method: "POST",
    });
    return data;
  }
  function changeSyncingProgressBarPercentage(percent) {
    $(".syncingprogressbar").css("width", `${percent}%`);
    $(".syncingprogressbar").attr("aria-valuenow", percent);
    $(".syncingprogressbar").text(`${percent}%`);
  }
  
  async function startSyncing() {
    // showProcessing();
    function appendList(data, bg) {
      $(".syncing_body_modal").prepend(
        `<div class="d-flex justify-content-center p-3 m-2 ds-${bg}">${data}</div>`
      );
    }
    $("#syncingbody_left_modal").modal("show");
    let data = {};
    let hubsage_data = {
      hubspot_contacts: [],
      quickbook_contacts: [],
    };
    data = await callSyncingRequest();
    let sagepage = 0;
    let progressbar = 0;
    if (data.success) {
      let repeatdata = {};
      hubsage_data.hubspot_contacts = [...data.data.hubspot_contacts];
      hubsage_data.quickbook_contacts = [...data.data.quickbook_contacts];
      $(".hubspot_contacts_number").html(data.data.hubspot_contacts.length);
      $(".sage_contacts_number").html(data.data.quickbook_contacts.length);
      let qbstartPositionend = false;
      while (true) {
        let query = { hubspotafter: 0, startPosition: 0 };
  
        // console.log({ repeatdata });
        if (repeatdata.success) data = repeatdata;
        // console.log(data.data);
        if (data.data.hubspotafter && data.data.hubspotafter.next) {
          query.hubspotafter = data.data.hubspotafter.next.after;
          // console.log("inceraserqury", query.hubspotafter);
        } else {
          console.log("making query zero");
          query.hubspotafter = 0;
        }
        //console.log(data.data.startPosition, "hello kaushal ");
        if (data.data.startPosition && data.data.startPosition.page !== 0) {
          sagepage = sagepage + 1;
          query.startPosition = sagepage;
          // console.log({ startPosition: query.startPosition });
        } else {
          query.startPosition = 0;
          // qbstartPositionend = true;
        }
        // console.log("query&&", query);
        if (query.hubspotafter !== 0 || query.startPosition !== 0) {
          repeatdata = await callSyncingRequest(query);
          //console.log("****", repeatdata);
          if (repeatdata.success) {
            hubsage_data.hubspot_contacts = [
              ...hubsage_data.hubspot_contacts,
              ...repeatdata.data.hubspot_contacts,
            ];
            hubsage_data.quickbook_contacts = [
              ...hubsage_data.quickbook_contacts,
              ...repeatdata.data.quickbook_contacts,
            ];
            $(".hubspot_contacts_number").html(
              hubsage_data.hubspot_contacts.length
            );
            $(".sage_contacts_number").html(
              hubsage_data.quickbook_contacts.length
            );
            // console.log({ dddddddd: repeatdata });
            // console.log("continue now");
            progressbar += 0.5;
            changeSyncingProgressBarPercentage(progressbar);
            continue;
          } else {
            // console.log("breakkk");
            progressbar = 25;
            changeSyncingProgressBarPercentage(progressbar);
            break;
          }
        } else {
          // console.log("breakkk");
          progressbar = 25;
          changeSyncingProgressBarPercentage(progressbar);
          break;
        }
      }
  
      if (
        hubsage_data.hubspot_contacts.length > 0 ||
        hubsage_data.quickbook_contacts.length > 0
      ) {
        let filteredhubquickbook = await ajaxRequest({
          url: "/api/filtercontactbeforesyncing" + location.search,
          method: "POST",
          body: hubsage_data,
        });
        progressbar = 35;
  
        changeSyncingProgressBarPercentage(progressbar);
        // setTimeout(() => {
        // }, 1000);
        if (filteredhubquickbook.success) {
          if (filteredhubquickbook.data.hubspot_body_contacts.length > 0) {
            // Inserting or Updating to hubspot records
            let hubspot_data_progress_bar = false;
            await Promise.all(
              filteredhubquickbook.data.hubspot_body_contacts.map(
                async (mp, i) => {
                  console.log("mp", mp);
                  let hub_body_data = await ajaxRequest({
                    url: "/api/inserthubspotrecord" + location.search,
                    method: "POST",
                    body: mp,
                  });
                  if (hub_body_data.success) {
                    progressbar += 0.5;
                    changeSyncingProgressBarPercentage(progressbar);
                    appendList(
                      mp.properties.firstname + " synced to HubSpot",
                      "success"
                    );
                  } else {
                    // Append Errors Here
                    appendList(
                      mp.properties.firstname + " failed to synced",
                      "error"
                    );
                  }
                  if (
                    i ==
                    filteredhubquickbook.data.hubspot_body_contacts.length - 1
                  ) {
                    hubspot_data_progress_bar = true;
                  }
                }
              )
            );
            if (hubspot_data_progress_bar) {
              progressbar = 55;
              changeSyncingProgressBarPercentage(progressbar);
              appendList("All Sage contacts synced with HubSpot", "success");
            }
          } else {
            progressbar = 55;
            changeSyncingProgressBarPercentage(progressbar);
            appendList("No Contacts found to synced in HubSpot", "success");
          }
          if (filteredhubquickbook.data.quickbook_body_contacts.length > 0) {
            // Inserting or Updating to Sage Records
            console.log("sagegreatorthanzero");
            let quickbook_data_progress_bar = false;
            await Promise.all(
              filteredhubquickbook.data.quickbook_body_contacts.map(
                async (mp, j) => {
                  console.log("checkingsgeposting", mp);
                  let qb_body_data = await ajaxRequest({
                    url: "/api/insertsagerecord" + location.search,
                    method: "POST",
                    body: mp,
                  });
                  console.log({ qb_body_data });
                  if (qb_body_data.success) {
                    progressbar += 0.5;
                    changeSyncingProgressBarPercentage(progressbar);
                    appendList(mp.DisplayName + " inserted to xero", "success");
                  } else {
                    // Append Errors Here
                    appendList(mp.DisplayName + " failed to Insert", "error");
                  }
                  if (
                    j ==
                    filteredhubquickbook.data.quickbook_body_contacts.length - 1
                  ) {
                    quickbook_data_progress_bar = true;
                  }
                }
              )
            );
            if (quickbook_data_progress_bar) {
              progressbar = 100;
              changeSyncingProgressBarPercentage(progressbar);
              appendList("All HubSpot contacts synced with xero", "green");
              console.log("timelog_window");
              let timelogdata = await ajaxRequest({
                url: "/savetimelog" + location.search,
                method: "GET",
              });
            }
          } else {
            progressbar = 100;
            changeSyncingProgressBarPercentage(progressbar);
            appendList("No Contacts found to synced in xero", "info");
            console.log("timelog_window");
            let timelogdata = await ajaxRequest({
              url: "/savetimelog" + location.search,
              method: "GET",
            });
          }
        } else {
          progressbar = 100;
          changeSyncingProgressBarPercentage(progressbar);
          appendList("No Contacts Found to sync");
          console.log("timelog_window");
          let timelogdata = await ajaxRequest({
            url: "/savetimelog" + location.search,
            method: "GET",
          });
        }
        console.log({ filteredhubquickbook });
      }
      // console.log({ hubsage_data });
      // Swal.close();
    } else {
      console.log({ ddddd: data });
      if (!data.sage && data.sage !== undefined) {
        location.href = "/api/auth/xero/app";
      } else {
        if (typeof data.error == "object") {
          $("#fullHeightModalRight").modal("show");
          data.error.forEach((val) => {
            setTimeout(() => {
              $("#fullHeightModalRight .modal-body .list-group").append(
                `<li class="list-group-item">
                <pre>${val.$message ? val.$message : val}</pre></li>`
              );
            }, 100);
          });
          // Swal.close();
        } else if (typeof data.error == "string") {
          if (data.error.includes("No Data")) {
            Swal.fire("Syncing", "Data is upto Date", "info");
          } else {
            Swal.fire("Syncing Failed", data.error, "error");
          }
        }
      }
    }
  
    // fetch("/api/start-syncing" + location.search, {
    //   method: "POST",
    // })
    //   .then((response) => response.json())
    //   .then((data) => {
    //     console.log("Success:", data);
  
    //   })
    //   .catch((error) => {
    //     console.error("Error:", error);
    //     Swal.close();
    //     // Swal.fire("Syncing Failed", "Something Went Wrong", "error");
    //   });
  }
  
  function renderOptionsofhubsage() {
    var options = JSON.parse($("#optionsofhubsage").val());
  
    if (!options) {
      options = [];
    }
    delete options._id;
    delete options.user_id;
  
    let toogleHubSageFieldOptions = {};
    console.log({ options });
    if (options.hubSageFields && options.hubSageFields.length > 0) {
      $("#sagemainstore").val(
        JSON.stringify({
          ...toogleHubSageFieldOptions,
          hubSageFields: options.hubSageFields,
        })
      );
    }
    if (Object.keys(options).length == 0) {
      $(".toogleHubSageFieldOptions").each(function () {
        let value = JSON.parse($(this).attr("option"));
        $(this).prop("checked", true);
        toogleHubSageFieldOptions[value.hub + "_" + value.sage] = true;
      });
      $("#sagemainstore").val(
        JSON.stringify({
          ...toogleHubSageFieldOptions,
          hubSageFields: [],
        })
      );
    } else {
      Object.entries(options).map(([key, value]) => {
        if (typeof value == "boolean") {
          // console.log(typeof value, key.replace(/\s+/g, ""), value);
          $(`#${key.replace(/\s+/g, "")}`).attr("checked", value);
          toogleHubSageFieldOptions[key] = value;
        }
        if (key == "transferFrom") {
          if (value.includes("HubSpot")) {
            $("#transferFromHubSpot").prop("checked", true);
          } else {
            $("#transferFromSage").prop("checked", true);
          }
        }
        if (key == "hubSageFields") {
          value.map((vr, i) => {
            add_custom_field_options();
            $(`#hub_custom_field_${i}`).val(vr.hub);
            $(`#sage_custom_field_${i}`).val(vr.sage);
            $(`#preference_custom_field_${i}`).val(vr.preference);
          });
        }
      });
      $("#sagemainstore").val(
        JSON.stringify({
          ...toogleHubSageFieldOptions,
          hubSageFields: options.hubSageFields,
        })
      );
    }
  
    // console.log({ options });
  }
  
  
  
 
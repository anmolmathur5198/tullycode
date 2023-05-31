function chooseDotApp(redirectTo) {
  var user = Cookies.get("user");
  if (user == undefined) {
    return Swal.fire("User", "User Data Not Found", "info");
  }
  Swal.fire({
    title: "Connecting...",
    html: "<b class='checkingRedirection'></b>",
    didOpen: () => {
      Swal.showLoading();
    },
  });
  user = JSON.parse(user);

  user["redirectTo"] = redirectTo;
  console.log({ user });
  fetch("/api/verify/dottoken", {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(user),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        if (data.redirectTo) {
          const b = $(".checkingRedirection");
          if (b) {
            b.html(data.data);
          }
          setTimeout(() => {
            window.location.href = data.redirectTo;
            // window.open(data.redirectTo, "_blank");
            Swal.close();
          }, 2000);
        }
        // console.log("data", data.data);
      } else {
        Swal.fire("User", data.error, "error");
      }
    })
    .catch((err) => {
      console.log(err);
    });
  // console.log(user);
}

function logout() {
  console.log("dash")
  Cookies.remove("hvrif");
  location.href = "/";
}

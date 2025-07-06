sap.ui.define([], () => {
    "use strict";
  
    return {
      formatDate(sDate) {
        if (sDate && sDate != "") {
          // sDate is formatted as YYYY-MM-DD
          let oDate = new Date(sDate + "T00:00:00"); // force LOCAL time,
          // without the T00:00:00 the Date would be UTC
          // and Western hemisphere dates will be a day out
          let oOptions = {
            year: "numeric",
            month: "long",
            day: "numeric",
          };
  
          return oDate.toLocaleString("en-US", oOptions);
        }
        return "";
      },
      formatCurrency: function (value) {
        if (value == null || isNaN(value)) return "";
  
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD", // fallback USD
          minimumFractionDigits: 0,
        }).format(value);
      },
    };
  });
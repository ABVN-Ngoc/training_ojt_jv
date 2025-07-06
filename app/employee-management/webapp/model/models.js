sap.ui.define(
  ["sap/ui/model/json/JSONModel", "sap/ui/Device"],
  function (JSONModel, Device) {
    "use strict";

    return {
      /**
       * Provides runtime information for the device the UI5 app is running on as a JSONModel.
       * @returns {sap.ui.model.json.JSONModel} The device model.
       */
      createDeviceModel: function () {
        var oModel = new JSONModel(Device);
        oModel.setDefaultBindingMode("OneWay");
        return oModel;
      },
      setGlobalModel: function (oView) {
        let aGender = [
          { key: "male", text: "Male" },
          { key: "female", text: "Female" },
        ];
        this._setModel(oView, aGender, "Gender");
      },
      setInitVisibleControl: function (oView) {
        //Check User information whether Admin than define the Admin Visible Control
        const oVisibilityModel = {
          Home: true,
          List: false,
          Detail: false,
          InputForm: false,
        };
        const oPayload = {
          ID: "",
          firstName: "",
          lastName: "",
          email: "",
          gender: "",
          dateOfBirth: "",
          hireDate: "",
          salary: 0,
          performanceRating: "",
          department: { ID: "" },
          role: { ID: "" },
        };
        this._setModel(oView, oVisibilityModel, "VisibleControl");
        this._setModel(oView, oPayload, "EmployeeInput");
      },
      getEmployee: async function (oView) {
        // Call Backend service to get Employee information
        oView.byId("table").setBusy(true);
        try {
          const oResponse = await fetch(
            "/odata/v4/ngoc123/Employees?$expand=role,department",
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                // Authorization: sBearerToken,
              },
            }
          );
          if (oResponse.status == 200) {
            let oJsonResponse = await oResponse.json();
            let aEmployeeList = oJsonResponse.value;
            this._setModel(oView, aEmployeeList, "EmployeeList");
            oView.byId("table").setBusy(false);
            return aEmployeeList;
          } else {
            // TODO: get data error from oJsonResponse
            const oJsonResponse = await oResponse.json();
            const oError = oJsonResponse.error;
            this.onShowErrorMessageBox("Error", oError, null);
            oView.byId("table").setBusy(false);
            return null;
          }
        } catch (error) {
          oView.byId("table").setBusy(false);
          return null;
        }
      },
      getRole: async function (oView) {
        // Call Backend service to get Role information
        try {
          const oResponse = await fetch("/odata/v4/ngoc123/Roles", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              // Authorization: sBearerToken,
            },
          });
          if (oResponse.status == 200) {
            let oJsonResponse = await oResponse.json();
            let aRole = oJsonResponse.value;
            this._setModel(oView, aRole, "Role");
            return aRole;
          } else {
            // TODO: get data error from oJsonResponse
            const oJsonResponse = await oResponse.json();
            const oError = oJsonResponse.error;
            this.onShowErrorMessageBox("Error", oError, null);
            return null;
          }
        } catch (error) {
          return null;
        }
      },
      getDepartment: async function (oView) {
        // Call Backend service to get Department information
        try {
          const oResponse = await fetch("/odata/v4/ngoc123/Departments", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              // Authorization: sBearerToken,
            },
          });
          if (oResponse.status == 200) {
            let oJsonResponse = await oResponse.json();
            let aDepartment = oJsonResponse.value;
            this._setModel(oView, aDepartment, "Department");
            return aDepartment;
          } else {
            // TODO: get data error from oJsonResponse
            const oJsonResponse = await oResponse.json();
            const oError = oJsonResponse.error;
            this.onShowErrorMessageBox("Error", oError, null);
            return null;
          }
        } catch (error) {
          return null;
        }
      },
      getEmployeeInfo: async function (oView) {
        // Call Backend service to get Employee information
        try {
          const oResponse = await fetch("/odata/v4/ngoc123/Employees", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              // Authorization: sBearerToken,
            },
          });
          if (oResponse.status == 200) {
            let oJsonResponse = await oResponse.json();
            let aEmployeeInfo = oJsonResponse.value;
            this._setModel(oView, aEmployeeInfo, "EmployeeInfo");
            return aEmployeeInfo;
          } else {
            // TODO: get data error from oJsonResponse
            const oJsonResponse = await oResponse.json();
            const oError = oJsonResponse.error;
            this.onShowErrorMessageBox("Error", oError, null);
            return null;
          }
        } catch (error) {
          return null;
        }
      },
      createEmployee: async function (oView, oPayload) {
        oView.setBusy(true);
        oView.byId("btnEdit").setBusy(true).setEnabled(false);

        const oRoleInfo = this._getModel(oView, "RoleInfo").getData();
        const sToken = oRoleInfo.token;
        const sPath = "/odata/v4/ngoc123/Employees";
        // Call backend to update form
        try {
          const oResponse = await fetch(sPath, {
            method: "POST",
            headers: {
              Authorization: "Bearer " + rawToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(oPayload),
          });
          oView.setBusy(false);
          return oResponse;
        } catch (error) {
          oView.setBusy(false);
        }
      },
      updateEmployeeInfo: async function (oView, oPayload, sID) {
        oView.setBusy(true);
        oView.byId("btnEdit").setBusy(true).setEnabled(false);
        let sPath = "/odata/v4/ngoc123/Employees('" + sID + "')";
        // Call backend to update form
        try {
          const oResponse = await fetch(sPath, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              // Authorization: sToken
            },
            body: JSON.stringify(oPayload),
          });
          oView.setBusy(false);
          oView.byId("btnEdit").setBusy(false).setEnabled(true);
          return oResponse;
        } catch (error) {
          oView.byId("btnEdit").setBusy(false).setEnabled(true);
          oView.setBusy(false);
        }
      },
      deleteEmployeeInfo: async function (oView, sID) {
        oView.byId("table").setBusy(true);
        let sPath = "/odata/v4/ngoc123/Employees('" + sID + "')";
        // Call backend to update form
        try {
          const oResponse = await fetch(sPath, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              // Authorization: sToken
            },
          });
          oView.byId("table").setBusy(false);
          return oResponse;
        } catch (error) {
          oView.byId("table").setBusy(false);
        }
      },
      getRoleLogin: async function (oView) {
        try {
          const oResponse = await fetch("/odata/v4/ngoc123/getRole", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (oResponse.status == 200) {
            let oJsonResponse = await oResponse.json();
            console.log("oJsonResponse", oJsonResponse)
            const roles = oJsonResponse.value;
            let oRoleInfo = {
              admin: false,
              employee: false,
            };

            if (roles.includes("admin")) {
              oRoleInfo = {
                admin: true,
                employee: false,
              };
            } else {
              oRoleInfo = {
                admin: false,
                employee: true,
              };
            }
            console.log("oRoleInfo", oRoleInfo);
            this._setModel(oView, oRoleInfo, "RoleInfo");
            return oResponse;
          }
        } catch (error) {
          return null;
        }
      },
      _setModel: function (oView, oData, sModelName) {
        oView.setModel(new JSONModel(oData), sModelName);
      },
      _getModel: function (oView, sModelName) {
        let oModel = oView.getModel(sModelName);
        return oModel;
      },
      _getTextI18n: function (sTextI18n) {
        // Use i18n model to get translated text
        let sText = i18n.getText(sTextI18n);
        return sText;
      },
    };
  }
);

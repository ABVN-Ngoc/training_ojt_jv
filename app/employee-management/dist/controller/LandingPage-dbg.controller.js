sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Messaging",
    "sap/m/MessageBox",
    "sap/m/Text",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/ValidateException",
    "./../model/models",
    "./../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/base/i18n/ResourceBundle",
  ],
  (
    Controller,
    MessageToast,
    Messaging,
    MessageBox,
    Text,
    JSONModel,
    ValidateException,
    Model,
    formatter,
    Filter,
    FilterOperator,
    ResourceBundle
  ) => {
    "use strict";

    return Controller.extend("employee-management.controller.LandingPage", {
      formatter: formatter,
      onInit: async function () {
        const oView = this.getView();
        Model.setGlobalModel(oView);
        Model.setInitVisibleControl(oView);
        // await Model.getEmployee(oView);
        await Model.getRole(oView);
        await Model.getDepartment(oView);
        await Model.getRoleLogin(oView);

        const oODataModel = new sap.ui.model.odata.v4.ODataModel({
          operationMode: "Server",
          serviceUrl: "/odata/v4/ngoc123/",
          synchronizationMode: "None",
        });

        this.byId("table").bindItems({
          path: "EmployeeList>/Employees",
          parameters: {
            $expand: "role,department",
          },
          template: new sap.m.ColumnListItem({
            type: "Active",
            press: this.onItemPress.bind(this),
            cells: [
              new Text({
                text: "{EmployeeList>firstName} {EmployeeList>lastName}",
              }),
              new sap.m.Text({ text: "{EmployeeList>gender}" }),
              new sap.tnt.InfoLabel({ text: "{EmployeeList>role/name}" }),
              new sap.m.Text({ text: "{EmployeeList>department/name}" }),
              new sap.m.Text({ text: "{EmployeeList>email}" }),
              new sap.m.Text({ text: "{EmployeeList>dateOfBirth}" }),
              new sap.m.Text({ text: "{EmployeeList>salary}" }),
              new sap.m.Button({
                id: "btn_Delete",
                press: this.onItemDelete.bind(this),
                icon: "sap-icon://decline",
                type: "Transparent",
                visible: "{RoleInfo>/admin}",
              }),
            ],
          }),
        });
        oView.setModel(oODataModel, "EmployeeList");

        //Get translated text from Model i18n
        this.modelI18n = ResourceBundle.create({ url: "i18n/i18n.properties" });

        // FilterBar in Table
        this.applyData = this.applyData.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.getFiltersWithValues = this.getFiltersWithValues.bind(this);

        this.oFilterBar = this.getView().byId("filterbar");
        this.oTableFilterbar = this.getView().byId("table");

        this.oFilterBar.registerFetchData(this.fetchData);
        this.oFilterBar.registerApplyData(this.applyData);
        this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValues);
      },
      onPressHome: function () {
        const oView = this.getView();
        this._clearDetailForm();
        this._clearForm();
        Model._getModel(oView, "VisibleControl").setProperty("/", {
          Home: true,
          List: false,
          InputForm: false,
          Detail: false,
        });
      },
      onPressInput: function () {
        const oView = this.getView();
        this._clearDetailForm();
        this._clearForm();
        Model._getModel(oView, "VisibleControl").setProperty("/", {
          Home: false,
          List: false,
          InputForm: true,
          Detail: false,
        });
      },
      onPressCreate: async function (oEvent) {
        const oView = this.getView();
        const oDataModel = Model._getModel(oView, "EmployeeInput").getData();
        const oModel = Model._getModel(oView, "EmployeeList");
        const sTrigger = this.modelI18n.getText("msgEmployeeCreate");
        const sFail = this.modelI18n.getText("msgFail");

        console.log("oDataModel", oDataModel);

        if (!this._validateForm()) {
          return;
        }
        const oPayload = {
          // ID: oDataModel.ID,
          firstName: oDataModel.firstName,
          lastName: oDataModel.lastName,
          email: oDataModel.email,
          gender: oDataModel.gender,
          dateOfBirth: oDataModel.dateOfBirth,
          hireDate: oDataModel.hireDate,
          department: { ID: oDataModel.department?.ID },
          role: { ID: oDataModel.role?.ID },
        };

        console.log("oPayload", oPayload);
        oView.setBusy(true);
        try {
          const oListBinding = oModel.bindList("/Employees");
          await oListBinding.create(oPayload);
          MessageToast.show(sTrigger);
          oView.setBusy(false);
          await oModel.refresh();
          this._clearForm();
        } catch (oError) {
          oView.setBusy(false);
          MessageBox.error(sFail, oError);
        }

        Model._getModel(oView, "VisibleControl").setProperty("/", {
          Home: false,
          List: true,
          InputForm: false,
          Detail: false,
        });
      },
      onPressList: function () {
        const oView = this.getView();
        this._refreshTable();
        this._clearDetailForm();
        this._clearForm();
        oView.getModel("VisibleControl").setProperty("/", {
          Home: false,
          List: true,
          InputForm: false,
          Detail: false,
        });
      },
      onItemPress: function (oEvent) {
        const oView = this.getView();
        const oItem = oEvent.getParameter("listItem") || oEvent.getSource();
        let oContext = oItem.getBindingContext("EmployeeList");
        const oSelectedData = oContext.getObject();
        Model._setModel(oView, oSelectedData, "EmployeeInfo");
        console.log(
          "EmployeeInfo press",
          Model._getModel(oView, "EmployeeInfo")
        );
        Model._getModel(oView, "VisibleControl").setProperty("/", {
          Home: false,
          List: false,
          InputForm: false,
          Detail: true,
        });
      },
      onItemDelete: async function (oEvent) {
        const oItem = oEvent.getSource().getParent();
        const oContext = oItem.getBindingContext("EmployeeList");

        if (!oContext) {
          MessageToast.show("No data found");
          return;
        }

        MessageBox.confirm(this.modelI18n.getText("msgDelete"), {
          onClose: async (sAction) => {
            if (sAction === MessageBox.Action.OK) {
              try {
                if (typeof oContext.delete === "function") {
                  await oContext.delete();
                  MessageToast.show(this.modelI18n.getText("msgDeleteSuccess"));
                } else {
                  MessageBox.error(this.modelI18n.getText("msgDeleteFail"));
                }
              } catch (err) {
                MessageBox.error(
                  this.modelI18n.getText("msgDeleteFail") + err.message
                );
              }
            }
          },
        });
      },
      _refreshTable: function () {
        // Binding trên sap.ui.table.Table
        const oTable = this.byId("table");
        const oBinding = oTable.getBinding("rows");

        if (oBinding) {
          oBinding.refresh(true); // true: force reload from backend
        }
      },
      onPressCloseDetail: async function () {
        const oView = this.getView();
        // await Model.getEmployee(oView);
        const oModel = Model._getModel(oView, "EmployeeList");
        await oModel.refresh();
        this._clearDetailForm();
        Model._getModel(oView, "VisibleControl").setProperty("/", {
          Home: false,
          List: true,
          InputForm: false,
          Detail: false,
        });
      },
      onPressUpdate: async function () {
        const oView = this.getView();
        const oModel = Model._getModel(oView, "EmployeeList");
        // const oDataModel = Model._getModel(oView, "EmployeeInfo").getData();
        const oDataModel = JSON.parse(
          JSON.stringify(Model._getModel(oView, "EmployeeInfo").getData())
        );
        const sTrigger = this.modelI18n.getText("msgEmployeeUpdate");

        if (!this._validateDetailForm()) {
          return;
        }

        oView.setBusy(true);
        if (!oDataModel || !oDataModel.ID) {
          MessageBox.error(this.modelI18n.getText("msgEmployeeInvalid"));
          this._clearDetailForm();
          return;
        }

        const sPath = `/Employees('${oDataModel.ID}')`;

        try {
          const oContextBinding = oModel.bindContext(sPath);
          const oBoundContext = await oContextBinding.getBoundContext();

          if (!oBoundContext) {
            MessageBox.error(this.modelI18n.getText("msgEmployee404"));
            this._clearDetailForm();
            return;
          }

          // Calculate salary
          const sRoleId = oDataModel.role?.ID;
          const sHireDateStr = oDataModel.hireDate;
          let iTotalSalary = 0;

          if (sRoleId && sHireDateStr) {
            const aRoles = Model._getModel(oView, "Role").getData();
            const oRole = aRoles.find((r) => r.ID === sRoleId);

            if (oRole && oRole.baseSalary) {
              const iBaseSalary = parseFloat(oRole.baseSalary) || 0;
              const oHireDate = new Date(sHireDateStr);
              const oToday = new Date();

              const iYearsOfService =
                oToday.getFullYear() -
                oHireDate.getFullYear() -
                (oToday.getMonth() < oHireDate.getMonth() ||
                (oToday.getMonth() === oHireDate.getMonth() &&
                  oToday.getDate() < oHireDate.getDate())
                  ? 1
                  : 0);

              const iBonus = iYearsOfService * 1000;
              iTotalSalary = iBaseSalary + iBonus;
            } else {
              MessageToast.show(this.modelI18n.getText("msgRole404"));
            }
          } else {
            MessageToast.show(this.modelI18n.getText("msgMissingRoleHireDate"));
          }
          console.log("iTotalSalary", iTotalSalary);

          console.log("266 oDataModel", oDataModel);
          oBoundContext.setProperty("ID", oDataModel.ID);
          oBoundContext.setProperty("firstName", oDataModel.firstName);
          // oBoundContext.setProperty("lastName", oDataModel.lastName);
          // oBoundContext.setProperty("gender", oDataModel.gender);
          // oBoundContext.setProperty("email", oDataModel.email);
          // oBoundContext.setProperty("dateOfBirth", oDataModel.dateOfBirth);
          // oBoundContext.setProperty("hireDate", oDataModel.hireDate);
          // oBoundContext.setProperty("role_ID", oDataModel.role.ID);
          // oBoundContext.setProperty("department_ID", oDataModel.department.ID);
          // oBoundContext.setProperty("salary", iTotalSalary);
          // oBoundContext.setProperty("role", {
          //   name: oDataModel.role?.name 
          // });
          // oBoundContext.setProperty("department", {
          //   name: oDataModel.department?.name
          // });


          MessageToast.show(sTrigger);
          oView.setBusy(false);
          await oModel.refresh();
          this._clearDetailForm();
        } catch (oError) {
          oView.setBusy(false);
          MessageBox.error(this.modelI18n.getText("msgError") + oError.message);
        }

        Model._getModel(oView, "VisibleControl").setProperty("/", {
          Home: false,
          List: true,
          InputForm: false,
          Detail: false,
        });
      },
      onPressCalSalary: function (params) {
        const oView = this.getView();
        const oEmployeeModel = oView.getModel("EmployeeInfo");
        const oRoleModel = oView.getModel("Role");
        const oEmployeeData = oEmployeeModel.getData();
        const sFail = this.modelI18n.getText("msgFailCalSalary");
        const sMissingRoleHireDate = this.modelI18n.getText(
          "msgMissingRoleHireDate"
        );
        const sRole404 = this.modelI18n.getText("msgRole404");

        oView.setBusy(true);

        try {
          const sRoleId = oEmployeeData.role?.ID;
          const sHireDateStr = oEmployeeData.hireDate;

          if (!sRoleId || !sHireDateStr) {
            MessageToast.show(sMissingRoleHireDate);
            oView.setBusy(false);
            return;
          }

          const aRoles = oRoleModel.getData();
          const oRole = aRoles.find((r) => r.ID === sRoleId);
          if (!oRole || !oRole.baseSalary) {
            MessageToast.show(sRole404);
            oView.setBusy(false);
            return;
          }

          const iBaseSalary = parseFloat(oRole.baseSalary) || 0;

          const oHireDate = new Date(sHireDateStr);
          const oToday = new Date();
          const iYearsOfService =
            oToday.getFullYear() -
            oHireDate.getFullYear() -
            (oToday.getMonth() < oHireDate.getMonth() ||
            (oToday.getMonth() === oHireDate.getMonth() &&
              oToday.getDate() < oHireDate.getDate())
              ? 1
              : 0);

          const iBonus = iYearsOfService * 1000;
          const iTotalSalary = iBaseSalary + iBonus;

          // Update model
          oEmployeeModel.setProperty("/salary", iTotalSalary);

          MessageToast.show(
            `Salary calculated: $${iTotalSalary.toLocaleString()}`
          );
          oView.setBusy(false);
        } catch (oError) {
          oView.setBusy(false);
          MessageBox.error(sFail, oError);
        }
      },
      onPressClose: async function () {
        const oView = this.getView();
        const oModel = Model._getModel(oView, "EmployeeList");
        await oModel.refresh();
        this._clearForm();
        Model._getModel(oView, "VisibleControl").setProperty("/", {
          Home: true,
          List: false,
          InputForm: false,
          Detail: false,
        });
      },
      onChangeEmail: function (oEvent) {
        const oInput = oEvent.getSource();
        let oValue = oInput.getValue();
        const rexMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!oValue.match(rexMail)) {
          oInput.setValueState("Error");
          oInput.setValueStateText("Input email not valid");
        } else {
          oInput.setValueState("Success");
          oInput.setValueStateText("Input email valid");
        }
      },
      // Handle Filterbar
      onFilterChange: function () {
        this.updateTable();
      },
      updateTable: function () {
        this.oTableFilterbar.setShowOverlay(true);
      },
      onFilterSearch: function () {
        let aFiltersTable = [],
          aFiltersComboBoxDepartment = [],
          aFiltersComboBoxRole = [];

        const aFilterGroupItems = this.oFilterBar.getFilterGroupItems();
        for (let i = 0; i < aFilterGroupItems.length; i++) {
          const oFilterGroupItem = aFilterGroupItems[i];
          const oControl = oFilterGroupItem.getControl();
          const sName = oFilterGroupItem.getName();
          if (sName === "Department") {
            const aSelectedKeys = oControl.getSelectedKeys();
            if (aSelectedKeys.length === 0) {
              aFiltersComboBoxDepartment = null;
            } else {
              aFiltersComboBoxDepartment = aSelectedKeys.map((sSelectedKey) => {
                return new sap.ui.model.Filter({
                  path: "department/ID",
                  operator: FilterOperator.EQ,
                  value1: sSelectedKey,
                });
              });
              aFiltersTable.push(
                new sap.ui.model.Filter(aFiltersComboBoxDepartment, false)
              );
            }
          }
          if (sName === "Role") {
            const aSelectedKeys = oControl.getSelectedKeys();
            if (aSelectedKeys.length === 0) {
              aFiltersComboBoxRole = null;
            } else {
              aFiltersComboBoxRole = aSelectedKeys.map((sSelectedKey) => {
                return new sap.ui.model.Filter({
                  path: "role/ID",
                  operator: FilterOperator.EQ,
                  value1: sSelectedKey,
                });
              });
              aFiltersTable.push(
                new sap.ui.model.Filter(aFiltersComboBoxRole, false)
              );
            }
          }
        }
        const oBinding = this.oTableFilterbar.getBinding("items");

        if (aFiltersTable.length > 0) {
          oBinding.filter(new sap.ui.model.Filter(aFiltersTable, true));
        } else {
          oBinding.filter(null);
        }
        this.oTableFilterbar.setShowOverlay(false);
      },
      onClearFilters: function () {
        const aFilterGroupItems = this.oFilterBar.getFilterGroupItems();

        for (let i = 0; i < aFilterGroupItems.length; i++) {
          const oFilterGroupItem = aFilterGroupItems[i];
          const oControl = oFilterGroupItem.getControl();
          const sName = oFilterGroupItem.getName();
          if (sName === "Department" || sName === "Role") {
            oControl.removeAllSelectedItems();
          }
        }
      },
      fetchData: function () {
        let aData = this.oFilterBar
          .getAllFilterItems()
          .reduce((aResult, oFilterItem) => {
            aResult.push({
              groupName: oFilterItem.getGroupName(),
              fieldName: oFilterItem.getName(),
              fieldData: oFilterItem.getControl().getSelectedKeys(),
            });
            return aResult;
          }, []);

        return aData;
      },
      applyData: function (aData) {
        aData.forEach(function (oDataObject) {
          let oControl = this.oFilterBar.determineControlByName(
            oDataObject.fieldName,
            oDataObject.groupName
          );
          oControl.setSelectedKeys(oDataObject.fieldData);
        }, this);
      },
      getFiltersWithValues: function () {
        const ogetAllFilterItems = this.oFilterBar.getFilterGroupItems();
        let aFiltersWithValue = ogetAllFilterItems.reduce(
          (aResult, oFilterGroupItem) => {
            let oControl = oFilterGroupItem.getControl();

            if (
              oControl &&
              oControl.getSelectedKeys &&
              oControl.getSelectedKeys().length > 0
            ) {
              aResult.push(oFilterGroupItem);
            }
            return aResult;
          },
          []
        );

        return aFiltersWithValue;
      },
      onSelectionChange: function (oEvent) {
        this.oFilterBar.fireFilterChange(oEvent);
      },
      handleUploadComplete: function (oEvent) {
        const aFiles = oEvent.getParameter("files");

        if (!aFiles || aFiles.length === 0) {
          MessageToast.show("No file selected.");
          return;
        }

        const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];

        for (let i = 0; i < aFiles.length; i++) {
          const file = aFiles[i];
          const fileType = file.type;

          if (!allowedTypes.includes(fileType)) {
            MessageToast.show("Invalid file type: " + file.name);
            return;
          }
        }

        this.byId("fileUploader").upload();
      },
      onSetLabelRole: function () {
        const oTable = this.getView().byId("table");
        const aItem = oTable.getItems();
        for (let i = 0; i < aItem.length; i++) {
          const aRowRecord = aItem[i].getCells();
          const sRole = aRowRecord[2];
          const sText = sRole.getText();
          switch (sText) {
            case "HR":
              sRole.setColorScheme(1);
              break;
            case "Manager":
              sRole.setColorScheme(2);
              break;
            case "CEO":
              sRole.setColorScheme(3);
              break;
            case "Backend Developer":
              sRole.setColorScheme(9);
              break;
            case "Frontend Developer":
              sRole.setColorScheme(5);
              break;
            case "Full Stack Developer":
              sRole.setColorScheme(6);
              break;
            case "UI/UX Designer":
              sRole.setColorScheme(7);
              break;
            case "Project Manager":
              sRole.setColorScheme(8);
              break;
          }
        }
        // Refresh table
        this._refreshTable();
      },
      _validateDetailForm: function () {
        const oView = this.getView();
        const oDataModel = Model._getModel(oView, "EmployeeInfo").getData();
        const sFillIn = this.modelI18n.getText("msgFillin");
        let sKey = "";

        const oFieldMapping = {
          firstName: "d_iFirstName",
          lastName: "d_iLastName",
          email: "d_iEmail",
          gender: "d_ComboBoxGender",
          dateOfBirth: "d_DateofBirth",
          hireDate: "d_hireDate",
          department: "d_ComboBoxDepartment",
          role: "d_ComboBoxRole",
        };

        let isValid = true;
        const aMessages = [];

        for (const [key, controlId] of Object.entries(oFieldMapping)) {
          const oControl = oView.byId(controlId);
          const sValue = oDataModel[key];

          const isComboBox = key === "department" || key === "role";
          const isEmpty = isComboBox
            ? !sValue?.ID || sValue.ID.trim() === ""
            : sValue === undefined || sValue === null || sValue === "";

          if (isEmpty) {
            oControl.setValueState("Error");
            oControl.setValueStateText("This field is required");
            isValid = false;

            switch (key) {
              case "firstName":
                sKey = "First Name";
                break;
              case "lastName":
                sKey = "Last Name";
                break;
              case "email":
                sKey = "Email";
                break;
              case "gender":
                sKey = "Gender";
                break;
              case "dateOfBirth":
                sKey = "Date Of Birth";
                break;
              case "hireDate":
                sKey = "Hire Date";
                break;
              case "department":
                sKey = "Department";
                break;
              case "role":
                sKey = "Role";
                break;
              default:
                break;
            }

            aMessages.push(`${sKey} is required`);
          } else {
            oControl.setValueState("None");
          }
        }

        const dDob = new Date(oDataModel.dateOfBirth);
        const dHire = new Date(oDataModel.hireDate);

        const oDobControl = oView.byId("d_DateofBirth");
        const oHireControl = oView.byId("d_hireDate");
        if (dDob >= dHire) {
          oDobControl.setValueState("Error");
          oHireControl.setValueState("Error");

          oDobControl.setValueStateText(
            "Date of birth must be before Hire date"
          );
          oHireControl.setValueStateText(
            "Hire date must be after Date of birth"
          );

          aMessages.push("Date of birth must be before Hire date");
          isValid = false;
        } else {
          oDobControl.setValueState("None");
          oHireControl.setValueState("None");
        }
        if (!isValid) {
          MessageBox.warning(aMessages.join("\n"), {
            title: sFillIn,
          });
        }

        return isValid;
      },
      _validateForm: function () {
        const oView = this.getView();
        const oDataModel = Model._getModel(oView, "EmployeeInput").getData();
        const sFillIn = this.modelI18n.getText("msgFillin");
        let sKey = "";
        const oFieldMapping = {
          firstName: "i_iFirstName",
          lastName: "i_iLastName",
          email: "i_iEmail",
          gender: "i_ComboBoxGender",
          dateOfBirth: "i_DateofBirth",
          hireDate: "i_hireDate",
          department: "i_ComboBoxDepartment",
          role: "i_ComboBoxRole",
        };

        let isValid = true;
        const aMessages = [];

        for (const [key, controlId] of Object.entries(oFieldMapping)) {
          const oControl = oView.byId(controlId);
          const sValue = oDataModel[key];

          const isComboBox = key === "department" || key === "role";
          const isEmpty = isComboBox
            ? !sValue?.ID || sValue.ID.trim() === ""
            : sValue === undefined || sValue === null || sValue === "";

          if (isEmpty) {
            oControl.setValueState("Error");
            oControl.setValueStateText("This field is required");
            isValid = false;

            switch (key) {
              case "firstName":
                sKey = "First Name";
                break;
              case "lastName":
                sKey = "Last Name";
                break;
              case "email":
                sKey = "Email";
                break;
              case "gender":
                sKey = "Gender";
                break;
              case "dateOfBirth":
                sKey = "Date Of Birth";
                break;
              case "hireDate":
                sKey = "Hire Date";
                break;
              case "department":
                sKey = "Department";
                break;
              case "role":
                sKey = "Role";
                break;
              default:
                break;
            }

            aMessages.push(`${sKey} is required`);
          } else {
            oControl.setValueState("None");
          }
        }

        const dDob = new Date(oDataModel.dateOfBirth);
        const dHire = new Date(oDataModel.hireDate);

        const oDobControl = oView.byId("i_DateofBirth");
        const oHireControl = oView.byId("i_hireDate");

        if (dDob >= dHire) {
          oDobControl.setValueState("Error");
          oHireControl.setValueState("Error");

          oDobControl.setValueStateText(
            "Date of birth must be before Hire date"
          );
          oHireControl.setValueStateText(
            "Hire date must be after Date of birth"
          );

          aMessages.push("Date of birth must be before Hire date");
          isValid = false;
        } else {
          oDobControl.setValueState("None");
          oHireControl.setValueState("None");
        }

        if (!isValid) {
          MessageBox.warning(aMessages.join("\n"), {
            title: sFillIn,
          });
        }

        return isValid;
      },
      _clearForm: function () {
        const oView = this.getView();
        const oModel = Model._getModel(oView, "EmployeeInput");

        const emptyData = {
          ID: null,
          firstName: "",
          lastName: "",
          email: "",
          gender: "",
          dateOfBirth: null,
          hireDate: null,
          department: {
            ID: "",
          },
          role: {
            ID: "",
          },
        };

        oModel.setData(emptyData);

        const oFieldMapping = {
          firstName: "i_iFirstName",
          lastName: "i_iLastName",
          email: "i_iEmail",
          gender: "i_ComboBoxGender",
          dateOfBirth: "i_DateofBirth",
          hireDate: "i_hireDate",
          department: "i_ComboBoxDepartment",
          role: "i_ComboBoxRole",
        };

        for (const controlId of Object.values(oFieldMapping)) {
          const oControl = oView.byId(controlId);
          if (oControl) {
            oControl.setValueState("None");
            oControl.setValue(""); // optional: reset visible field
          }
        }
      },
      _clearDetailForm: function () {
        const oView = this.getView();
        const oModel = Model._getModel(oView, "EmployeeInput");

        const emptyData = {
          ID: null,
          firstName: "",
          lastName: "",
          email: "",
          gender: "",
          dateOfBirth: null,
          hireDate: null,
          department: {
            ID: "",
          },
          role: {
            ID: "",
          },
        };

        oModel.setData(emptyData);

        const oFieldMapping = {
          firstName: "d_iFirstName",
          lastName: "d_iLastName",
          email: "d_iEmail",
          gender: "d_ComboBoxGender",
          dateOfBirth: "d_DateofBirth",
          hireDate: "d_hireDate",
          department: "d_ComboBoxDepartment",
          role: "d_ComboBoxRole",
        };

        for (const controlId of Object.values(oFieldMapping)) {
          const oControl = oView.byId(controlId);
          if (oControl) {
            oControl.setValueState("None");
            oControl.setValue(""); // optional: reset visible field
          }
        }
      },
      _formatToDateOnly: function (oDate) {
        if (!isNaN(oDate)) {
          let sDate = new Date().toISOString().slice(0, 10);
          return sDate;
        } else {
          console.warn("Invalid date:", oDate);
          return null;
        }
      },
    });
  }
);

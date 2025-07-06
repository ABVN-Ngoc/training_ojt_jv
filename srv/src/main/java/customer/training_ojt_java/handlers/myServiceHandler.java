package customer.training_ojt_java.handlers;

import com.sap.cds.services.handler.annotations.On;

import java.util.Collection;
import java.util.Map;
import com.sap.cds.Result;

import java.math.BigDecimal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.sap.cds.services.EventContext;
import com.sap.cds.ql.Select;
import com.sap.cds.services.handler.EventHandler;
import com.sap.cds.services.handler.annotations.ServiceName;
import com.sap.cds.services.persistence.PersistenceService;
import cds.gen.service.Service_;
import cds.gen.service.Roles_;
import cds.gen.service.Employees_;
import cds.gen.service.Employees;
import cds.gen.service.GetRoleContext;
import com.sap.cds.services.cds.CdsCreateEventContext;
import com.sap.cds.services.cds.CqnService;
import com.sap.cds.services.request.UserInfo;

@Component
@ServiceName(Service_.CDS_NAME)
public class myServiceHandler implements EventHandler {
  @Autowired
  PersistenceService db;
  @Autowired
  UserInfo userInfo;
  private static final Logger logger = LoggerFactory.getLogger(myServiceHandler.class);

  // When post employee
  @On(event = { CqnService.EVENT_CREATE }, entity = Employees_.CDS_NAME)
  public void calSalary(EventContext context) {
    if (context instanceof CdsCreateEventContext) {
      CdsCreateEventContext createContext = (CdsCreateEventContext) context;
      createContext.getCqn().entries().forEach(this::updateSalary);
    }
  }

  @On(event = { GetRoleContext.CDS_NAME })
  public void getRole(GetRoleContext context) {
    Collection<String> roles = userInfo.getRoles();
    String cvRoles = String.valueOf(roles);
    context.setResult(cvRoles);
  }

  private void updateSalary(Map<String, Object> entry) {
    try {
      // Get hire date from entry and convert to LocalDate
      Object oHireDate = entry.get(Employees.HIRE_DATE);
      LocalDate dHireDate = LocalDate.parse(oHireDate.toString());

      // Get role map and extract role ID
      Map<String, Object> mRole = (Map<String, Object>) entry.get("role");
      String sRoleId = null;
      if (mRole != null) {
        sRoleId = (String) mRole.get("ID");
      }

      // Ensure role ID is string
      String sCvRoleId = sRoleId != null ? sRoleId : "";

      // Calculate working years
      LocalDate dToday = LocalDate.now();
      long nWorkYears = ChronoUnit.YEARS.between(dHireDate, dToday);
      if (nWorkYears < 0) {
        nWorkYears = 0;
      }

      // Initialize base salary
      BigDecimal bdBaseSalary = BigDecimal.ZERO;

      try {
        // Query role data to get base salary
        Result oResult = db.run(
            Select.from(Roles_.CDS_NAME)
                .columns("baseSalary")
                .where(r -> r.get("ID").eq(sCvRoleId)));

        Map<String, Object> mRow = oResult.first(Map.class).orElse(null);
        if (mRow != null) {
          Object oBaseSalary = mRow.get("baseSalary");
          if (oBaseSalary instanceof Number) {
            bdBaseSalary = new BigDecimal(((Number) oBaseSalary).toString());
          }
        }

      } catch (Exception oErr) {
        logger.error("Error when retrieving baseSalary for role ID: {}", sCvRoleId, oErr);
      }

      // Calculate total salary
      BigDecimal bdSalary = bdBaseSalary.add(BigDecimal.valueOf(nWorkYears * 1000L));
      entry.put(Employees.SALARY, bdSalary);

      System.out.println("Salary: " + bdSalary);

    } catch (Exception oEx) {
      logger.error("Unexpected error when calculating salary", oEx);
    }
  }
}
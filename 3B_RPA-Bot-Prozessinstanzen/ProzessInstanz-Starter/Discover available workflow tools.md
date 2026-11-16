# Build Camunda Process Instance Starter – Main.xaml

## Steps

### Step 1: Discover available workflow tools
Call `ProxyTool` to list available host-registered tools (e.g. `RpaWorkflowCreateTool`, `RpaWorkflowEditTool`, `GetErrorsTool`) so the correct tool signatures are known before writing any XAML.

### Step 2: Create the Main.xaml skeleton
Using `ProxyTool(RpaWorkflowCreateTool)`, overwrite the existing `Main.xaml` with a skeleton that contains:
- All required namespace declarations (Excel, System, UIAutomation)
- Workflow-level variables: `dt_Prozesse` (DataTable), `i_RowIndex` (Integer)
- Outer `ExcelApplicationCard` scoped to `ProzessInstanzen.xlsx` / sheet `ProzessInstanzen`
- `ReadRangeX` → `dt_Prozesse`
- Comment placeholders: `<!-- SECTION: Browser & Login -->`, `<!-- SECTION: ForEachRow Loop -->`, `<!-- SECTION: Logout -->`, `<!-- SECTION: Save Excel -->`

### Step 3: Fill in the Browser Login section
Using `RpaWorkflowEditTool`, replace `<!-- SECTION: Browser & Login -->` with:
- `UseApplicationBrowser` (Chrome, `http://localhost:8080`)
- `TypeInto` → username field → `"demo"`
- `TypeInto` → password field → `"demo"`
- `Click` → Login button
- `Delay` (2 seconds) waiting for Tasklist to load
- `Assign i_RowIndex = 0`

### Step 4: Fill in the ForEachRow loop with Try/Catch
Using `RpaWorkflowEditTool`, replace `<!-- SECTION: ForEachRow Loop -->` with a `ForEachRow` iterating over `dt_Prozesse` (row variable `CurrentRow`) containing a `TryCatch`:
- **Try block** (13 substeps):
  1. `Click` → "Start process" button
  2. `Delay` (1 s)
  3. `Click` → process item whose text matches `CurrentRow("Prozessname").ToString()` → `"P1_Auftragseingang"`
  4. `Delay` (1 s)
  5. `TypeInto` Firmenname → `CurrentRow("firmenname").ToString()`
  6. `TypeInto` Kontaktperson → `CurrentRow("kontaktperson").ToString()`
  7. `TypeInto` E-Mail-Adresse → `CurrentRow("kontaktEmail").ToString()`
  8. `Select` Anfrageart dropdown → `CurrentRow("anfrageart").ToString()`
  9. `If CurrentRow("notfallCheck").ToString() = "True"` → `Check` checkbox; `Else` → `Uncheck`
  10. `TypeInto` Befallsart → `CurrentRow("befallsart").ToString()`
  11. `TypeInto` Betriebsgröße → `CurrentRow("betriebsgroesse").ToString()`
  12. `TypeInto` Wunschtermin → `CurrentRow("wunschtermin").ToString()`
  13. `Click` → "Start" submit button
  14. `Delay` (2 s) waiting for Tasklist to reload
  15. `WriteCellX` → `"K" & (i_RowIndex + 2).ToString()` = `"Erfolgreich"`
  16. `WriteCellX` → `"L" & (i_RowIndex + 2).ToString()` = `DateTime.Now.ToString("dd.MM.yyyy HH:mm:ss")`
- **Catch `(Exception ex)`**:
  - `WriteCellX` → `"K" & (i_RowIndex + 2).ToString()` = `"Fehler: " & ex.Message`
  - `Navigate` → `http://localhost:8080`
- **Finally**:
  - `Assign i_RowIndex = i_RowIndex + 1`

### Step 5: Fill in the Logout and Save Excel sections
Using `RpaWorkflowEditTool`, replace `<!-- SECTION: Logout -->` and `<!-- SECTION: Save Excel -->` with:
- `Click` → user account / avatar menu (top-right in Tasklist)
- `Delay` (0.5 s)
- `Click` → "Sign Out" / "Abmelden" menu item
- `SaveExcelFileX` (saves ProzessInstanzen.xlsx with all status/timestamp updates)

### Step 6: Validate and fix compilation errors
Call `ProxyTool(GetErrorsTool)` on `Main.xaml`. For each reported error, call `RpaWorkflowEditTool` to correct the offending activity, selector, or expression until the file compiles with zero errors.

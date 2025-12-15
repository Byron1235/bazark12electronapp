import pandas as pd
import re

# ==========================
# CONFIGURACIÓN
# ==========================
excel_file = "python/K 12 (version 1).xlsx"          # <-- cambia al nombre de tu archivo
sheet_name = 0                   # hoja (0 = primera)
table_name = "productos"     # <-- pon el nombre deseado
output_sql = "output.sql"

dialect = "sqlite"               # sqlite | mysql | postgres


# ==========================
# Función para inferir tipos SQL
# ==========================
def infer_sql_type(dtype):
    if pd.api.types.is_integer_dtype(dtype):
        return "INTEGER"
    if pd.api.types.is_float_dtype(dtype):
        return "REAL"
    if pd.api.types.is_bool_dtype(dtype):
        return "BOOLEAN"
    return "TEXT"


# ==========================
# Sanitizar nombres de columnas
# ==========================
def clean_column(name):
    name = str(name).strip().lower()
    name = re.sub(r"[^a-zA-Z0-9_]", "_", name)
    name = re.sub(r"_+", "_", name)
    return name


# ==========================
# Cargar Excel
# ==========================
df = pd.read_excel(excel_file, sheet_name=sheet_name)

# Limpiar columnas
df.columns = [clean_column(c) for c in df.columns]


# ==========================
# Generar CREATE TABLE
# ==========================
sql = f"DROP TABLE IF EXISTS {table_name};\n\n"
sql += f"CREATE TABLE {table_name} (\n"
sql += "    id INTEGER PRIMARY KEY AUTOINCREMENT,\n"   # 👈 AGREGADO

cols_sql = []
for col in df.columns:
    sql_type = infer_sql_type(df[col].dtype)
    cols_sql.append(f"    {col} {sql_type}")

sql += ",\n".join(cols_sql) + "\n);\n\n"


# ==========================
# Generar INSERTS (sin ID)
# ==========================
column_list = ", ".join(df.columns)     # columnas sin id

for _, row in df.iterrows():
    values = []
    for v in row:
        if pd.isna(v):
            values.append("NULL")
        elif isinstance(v, str):
            values.append("'" + v.replace("'", "''") + "'")
        else:
            values.append(str(v))

    sql += f"INSERT INTO {table_name} ({column_list}) VALUES ({', '.join(values)});\n"


# ==========================
# Guardar archivo SQL
# ==========================
with open(output_sql, "w", encoding="utf-8") as f:
    f.write(sql)

print("✔ Archivo SQL generado:", output_sql)

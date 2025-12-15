import sqlite3

# Crea o abre la base de datos
conn = sqlite3.connect("bazar2.db")
cursor = conn.cursor()

# Leer archivo SQL
with open("./output.sql", "r", encoding="utf-8") as f:
    sql_script = f.read()

# Ejecutar todo
cursor.executescript(sql_script)

conn.commit()
conn.close()

print("Base de datos creada exitosamente.")

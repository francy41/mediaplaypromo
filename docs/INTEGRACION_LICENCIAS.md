# 🔑 Integración de licencias — YF AUTO CLIP

Guía para el desarrollador del programa (YankyFilms). Con esto, cada compra queda
protegida: si se reembolsa una venta, se revoca la clave y el software deja de funcionar.

## Cómo funciona

1. Cuando un cliente compra en mediaplaypromo.com, el sistema genera una **clave única**
   con formato `YF-XXXX-XXXX-XXXX-XXXX` y se la muestra/entrega.
2. El programa, **al arrancar (o al activarse)**, debe pedir esa clave y **validarla online**.
3. Si la clave es válida → el programa funciona. Si está revocada/no existe → se bloquea.
4. El administrador puede **revocar** una clave desde el panel (en reembolsos) → la próxima
   validación devolverá `valid: false`.

## Endpoint de validación (público)

```
POST https://mediaplaypromo.com/api/license/validate
Content-Type: application/json

{ "key": "YF-XHXE-DK33-PQLY-CP87" }
```

**Respuesta si es válida:**
```json
{ "valid": true, "product": "yf-auto-clip", "activations": 1, "maxActivations": 3 }
```

**Respuesta si NO es válida:**
```json
{ "valid": false, "reason": "revoked" }   // o "not_found"
```

## Comportamiento recomendado en el software

- **Primera vez:** pedir la clave, validarla. Si `valid:true`, guardarla localmente
  (registro/fichero cifrado) y dejar pasar.
- **Siguientes arranques:** revalidar online de vez en cuando (p. ej. 1 vez al día).
  Si hay internet y devuelve `valid:false` → bloquear y pedir clave nueva.
- **Sin internet:** permitir un margen de gracia (p. ej. 3–7 días) antes de exigir
  revalidación, para no fastidiar a usuarios legítimos sin conexión.
- Mensaje al bloquear: "Licencia no válida o revocada. Contacta soporte@mediaplaypromo.com".

## Ejemplos de código

### Python
```python
import requests

def validar_licencia(clave: str) -> bool:
    try:
        r = requests.post(
            "https://mediaplaypromo.com/api/license/validate",
            json={"key": clave}, timeout=10,
        )
        data = r.json()
        return bool(data.get("valid"))
    except Exception:
        return True  # margen de gracia si no hay internet (ajustar a gusto)
```

### C# (.NET)
```csharp
using System.Net.Http;
using System.Text;
using System.Text.Json;

async Task<bool> ValidarLicencia(string clave) {
    using var http = new HttpClient();
    var body = new StringContent(
        JsonSerializer.Serialize(new { key = clave }),
        Encoding.UTF8, "application/json");
    var resp = await http.PostAsync(
        "https://mediaplaypromo.com/api/license/validate", body);
    var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
    return json.RootElement.GetProperty("valid").GetBoolean();
}
```

### JavaScript / Electron
```js
async function validarLicencia(clave) {
  const r = await fetch("https://mediaplaypromo.com/api/license/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: clave }),
  });
  const data = await r.json();
  return data.valid === true;
}
```

## Notas
- El endpoint cuenta las activaciones (`activations`) — opcionalmente puedes limitar
  por nº de equipos usando `maxActivations`.
- La revocación es inmediata desde el panel del admin (`/licenses`).
- No expongas ninguna clave secreta en el .exe: este endpoint es **público** y solo
  recibe la clave del cliente.

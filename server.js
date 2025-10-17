const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use("/AR", express.static(path.join(__dirname, "AR"))); // 👈 importante

const salas = {}; // { salaId: [ {id, name, personaje} ] }

io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado:", socket.id);

  // Crear sala
  socket.on("crearSala", ({ salaId, nombre, personaje }) => {
    if (salas[salaId]) {
      socket.emit("error", "La sala ya existe");
      return;
    }

    salas[salaId] = [];
    const jugador = { id: socket.id, name: nombre, personaje };
    salas[salaId].push(jugador);
    socket.join(salaId);

    console.log(`Sala creada: ${salaId} por ${nombre} (${personaje})`);
    socket.emit("salaCreada", salaId);
    io.to(salaId).emit("actualizarLobby", salas[salaId]);
  });

  // Unirse a sala
  socket.on("unirseSala", ({ salaId, playerName, personaje }) => {
    if (!salas[salaId]) {
      socket.emit("error", "La sala no existe");
      return;
    }

    const jugador = { id: socket.id, name: playerName, personaje };
    salas[salaId].push(jugador);
    socket.join(salaId);

    console.log(`${playerName} se unió a la sala ${salaId} (${personaje})`);
    socket.emit("unidoSala", salaId);
    io.to(salaId).emit("actualizarLobby", salas[salaId]);
  });

  // Desconexión
  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);

    for (const salaId in salas) {
      const index = salas[salaId].findIndex(j => j.id === socket.id);
      if (index !== -1) {
        salas[salaId].splice(index, 1);
        io.to(salaId).emit("actualizarLobby", salas[salaId]);
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

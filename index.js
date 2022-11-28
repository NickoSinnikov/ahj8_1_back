const http = require('http');
const Koa = require('koa');
const cors = require('koa2-cors');
const koaBody = require('koa-body');
const app = new Koa();

class Tickets {
  constructor(id, name, description, status, created) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.status = status;
    this.created = created;
  }
}
const tickets = [];

const firstTicket = new Tickets(
  1,
  'Заменить катридж',
  'Катридж на складе',
  false,
  new Date()
);
const secondTicket = new Tickets(
  2,
  'Переустановить ОС',
  'Windows 11',
  false,
  new Date()
);
tickets.push(firstTicket);
tickets.push(secondTicket);

app.use(
  koaBody({
    urlencoded: true,
    multipart: true,
    text: true,
    json: true,
  })
);

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }
  const headers = { 'Access-Control-Allow-Origin': '*' };

  if (ctx.request.method === 'OPTIONS') {
    ctx.response.set({ ...headers });
  }

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (err) {
      err.headers = { ...err.headers, ...headers };
      throw err;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Method': 'GET, POST, PUT, DELETE, PATCH',
    });
    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set(
        'Access-Control-Allow-Headers',
        ctx.request.get('Access-Control-Request-Headers')
      );
    }
    ctx.response.status = 204;
  }
});

app.use(async (ctx) => {
  ctx.response.set({
    'Access-Control-Allow-Origin': '*',
  });
  const { method, id } = ctx.request.query;
  const { name, description } = ctx.request.body;
  switch (method) {
    case 'allTickets':
      ctx.response.body = tickets.map((item) => {
        return {
          id: item.id,
          name: item.name,
          status: item.status,
          created: item.created,
        };
      });
      return;
    case 'ticketById':
      if (id) {
        const ticket = tickets.find((item) => item.id === id);
        if (ticket) {
          ctx.response.body = ticket;
        } else {
          ctx.response.status = 404;
        }
      }
      return;
    case 'createTicket':
      const newId = uuid.v4();
      const created = new Date();
      tickets.push(new Tickets(newId, name, description, false, created));
      ctx.response.body = tickets;
      return;
    case 'removeById':
      const index = tickets.findIndex((item) => item.id === id);
      tickets.splice(index, 1);
      ctx.response.body = true;
      return;
    case 'editTicket':
      if (id) {
        const index = tickets.findIndex((item) => item.id === id);
        tickets[index].name = name;
        tickets[index].description = description;
      }
      ctx.response.body = true;
      // ctx.response.body = tickets[index];
      return;
    default:
      ctx.response.status = 404;
      return;
  }
});

const server = http.createServer(app.callback());
const port = process.env.PORT || 8080;
server.listen(port, () => console.log('Server started'));

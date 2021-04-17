import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';

const rssSchema = yup.string().url();
const form = document.querySelector('form');
const input = document.querySelector('input[name="url"]');
const feeds = document.querySelector('.feeds');
const posts = document.querySelector('.posts');
const feedback = document.querySelector('.feedback');
const modalTitle = document.querySelector('.modal-title');
const modalBody = document.querySelector('.modal-body');
const fullArticle = document.querySelector('.full-article');

const state = {
  form: {
    error: '',
  },
  currentData: '',
  feeds: [],
};

const isValidRss = (url) => {
  if (state.feeds.includes(url)) {
    watchedState.form.error = 'exist';
    return;
  }
  return rssSchema.isValid(url)
    .then((res) => {
      if (res) {
        const feed = `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${url}`;
        axios.get(feed)
          .then((response) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response.data.contents, "application/xml");
            if (doc.querySelector('rss')) {
              watchedState.form.error = 'valid';
              state.feeds.push(url);
              return doc;
            } else {
              watchedState.form.error = 'invalid';
              throw new Error('ups');
            }
          }).then((data) => watchedState.currentData = data)
          .catch((err) => {
            watchedState.form.error = 'inetError';
        });
      } else {
        watchedState.form.error = 'invalid';
      }
    }
  );
};

const feedsRender = (doc) => {
  form.reset();
  if (!feeds.querySelector('h2')) {
    const h2 = document.createElement('h2');
    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'mb-5');
    h2.textContent = 'Фиды';
    feeds.appendChild(h2);
    feeds.appendChild(ul);
  }
  const ul = feeds.querySelector('ul');
  const li = document.createElement('li');
  const h3 = document.createElement('h3');
  const p = document.createElement('p');
  li.classList.add('list-group-item');
  h3.textContent = doc.querySelector('title').textContent;
  p.textContent = doc.querySelector('description').textContent;
  li.appendChild(p);
  li.appendChild(h3);
  ul.prepend(li);
};

const postsRender = (doc) => {
  if (!posts.querySelector('h2')) {
    const h2 = document.createElement('h2');
    const ul = document.createElement('ul');
    ul.classList.add('list-group');
    h2.textContent = 'Посты';
    posts.appendChild(h2);
    posts.appendChild(ul);
  }
  const ul = posts.querySelector('ul');
  const items = doc.querySelectorAll('item');
  items.forEach((item, index) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const button = document.createElement('button');
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const href = item.querySelector('link').textContent;
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    a.classList.add('font-weight-bold');
    a.dataset.id = index;
    a.setAttribute('target', '_blank');
    a.setAttribute('href', href);
    button.setAttribute('type', 'button');
    button.classList.add('btn', 'btn-primary', 'btn-sm');
    button.dataset.id = index;
    button.dataset.toggle = 'modal';
    button.dataset.target = '#modal';
    a.textContent = title;
    button.textContent = 'Просмотр';
    li.appendChild(a);
    li.appendChild(button);
    button.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      modalTitle.textContent = title;
      modalBody.textContent = description;
      fullArticle.setAttribute('href', href);
    });
    ul.prepend(li);
  });
};

const errorHandler = (error) => {
  switch (error) {
    case 'invalid':
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.classList.remove('text-success');
      feedback.textContent = 'Ссылка должна быть валидным URL';
      break;
    case 'exist':
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.classList.remove('text-success');
      feedback.textContent = 'RSS уже существует';
      break;
    case 'valid':
      input.classList.remove('is-invalid');
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      feedback.textContent = 'RSS успешно загружен';
      break;
    case 'inetError':
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.classList.remove('text-success');
      feedback.textContent = 'Ошибка сети';
    default:
      break;
  }
};

const watchedState = onChange(state, (path, value) => {
  if (path === 'form.error') {
    errorHandler(value);
  }
  if (path === 'currentData') {
    feedsRender(state.currentData);
    postsRender(state.currentData);
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const feed = formData.get('url');
  isValidRss(feed);
});

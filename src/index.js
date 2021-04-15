import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';

const rssSchema = yup.string().url();

const isRss = (url) => {
  return rssSchema.isValid(url)
    .then((res) => {
      if (res) {
        const feed = `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${url}`;
        axios.get(feed)
          .then((response) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response.data.contents, "application/xml");
            const data = doc.querySelector('rss') ? doc : 'It\'s not RSS';
            // console.log();
            return data;
          }).then((data) => console.log(data))
          .catch((err) => {
            watchedState.form.processError = 'Error!';
            throw err;
        });
      } else {
        console.log('it\'s not valid url');
      }
    }
  );
};

const state = {
  form: {
    // valid: true,
    processError: '',
    error: '',
  },
  currentData: '',
  feeds: [],
};

const form = document.querySelector('form');
const input = document.querySelector('input[name="url"]');
const feeds = document.querySelector('.feeds');
const feedback = document.querySelector('.feedback');

const render = (doc, parent) => {
  form.reset();
  const h2 = document.createElement('h2');
  const ul = document.createElement('ul');
  const li = document.createElement('li');
  const h3 = document.createElement('h3');
  const p = document.createElement('p');
  ul.classList.add('list-group', 'mb-5');
  li.classList.add('list-group-item');
  // feedback.classList.remove('text-danger');
  // feedback.classList.add('text-success');
  h2.textContent = 'Фиды';
  h3.textContent = doc.querySelector('title').textContent;
  p.textContent = doc.querySelector('description').textContent;
  // feedback.textContent = 'RSS успешно загружен';
  li.appendChild(p);
  li.appendChild(h3);
  ul.appendChild(li);
  feeds.textContent = '';
  feeds.appendChild(h2);
  feeds.appendChild(ul);
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
    default:
      break;
  }
};

const watchedState = onChange(state, (path, value) => {
  if (path === 'form.error') {
    errorHandler(value);
  }
  if (path === 'currentData') {
    render(state.currentData);
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const feed = formData.get('url');
  console.log(isRss(feed));
});

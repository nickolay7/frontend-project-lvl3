export default (xml) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const title = doc.querySelector('title');
  const description = doc.querySelector('description');
  const postsList = doc.querySelectorAll('item');
  const rss = doc.querySelector('rss');
  return {
    rss, title, description, postsList,
  };
};

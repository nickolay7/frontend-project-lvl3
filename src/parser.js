export default (xml) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const errors = doc.querySelector('parsererror');
  if (errors) {
    throw new Error('feed.noRss');
  }
  const title = doc.querySelector('title');
  const description = doc.querySelector('description');
  const posts = doc.querySelectorAll('item');
  const postsList = [...posts].map((post) => {
    const pubDate = Date.parse(post.querySelector('pubDate').textContent);
    const postTitle = post.querySelector('title').textContent;
    const postDescription = post.querySelector('description').textContent;
    const link = post.querySelector('link').textContent;
    return {
      postTitle, postDescription, pubDate, link,
    };
  });
  return {
    title, description, postsList,
  };
};

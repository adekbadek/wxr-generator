const assert = require("assert");
const xmlbuilder = require("xmlbuilder");
const dateformat = require("date-format");

const formatDate = maybeDate => {
  if (typeof maybeDate !== "object") {
    return maybeDate;
  }
  return dateformat("yyyy-MM-dd hh:mm:ss", new Date(maybeDate));
};

const rId = () => Math.floor(Math.random() * 100000);
module.exports = class Generator {
  /**
   * name: site name
   * url: site url
   * description: site description
   * language: site language, default is en-US
   * base_site_url: same as url
   * base_blog_url: same as url
   */
  constructor({
    name,
    url,
    description,
    language = "en-US",
    base_site_url,
    base_blog_url
  }) {
    base_site_url = base_site_url || url;
    base_blog_url = base_blog_url || url;

    this.xml = xmlbuilder
      .create("rss")
      .att("xmlns:excerpt", "http://wordpress.org/export/1.2/expert")
      .att("xmlns:content", "http://purl.org/rss/1.0/modules/content/")
      .att("xmlns:wfw", "http://wellformedweb.org/CommentAPI/")
      .att("xmlns:dc", "http://purl.org/dc/elements/1.1/")
      .att("xmlns:wp", "http://wordpress.org/export/1.2/")
      .att("version", "2.0");
    this.channel = this.xml.ele("channel");
    this.channel.ele("wp:wxr_version", {}, 1.2);
    this.channel.ele("title", {}, name);
    this.channel.ele("link", {}, url);
    this.channel.ele("description", {}, description);
    this.channel.ele("language", {}, language);
    this.channel.ele("wp:base_site_url", {}, base_site_url);
    this.channel.ele("wp:base_blog_url", {}, base_blog_url);
    this.channel.ele("generator", {}, "https://npmjs.com/wxr-generator");
  }

  /**
   * id: post Id, if not provied, random ID will be generated.
   * url: post permalink url.
   * slug: post slug name if it exists.
   * date: post create time.
   * title: post title.
   * author: post author, it equals author's login name.
   * content: post content
   * summary: post summary
   * comment_status: post comment status, default is `open`, it can be `open` or `close`.
   * ping_status: post ping status, default is `open`, it can be `open` or `close`.
   * password: post visit password if it should, default is empty.
   * categories: post categories, it's an array item. Every item should has `slug` and `name` prototype.
   * tags: post tags, it's an array item. Every item should has `slug` and `name` prototype.
   */
  addPost({
    slug,
    title,
    author,
    url,
    content = "",
    summary = "",
    id = rId(),
    date = new Date(),
    comment_status = "open",
    ping_status = "open",
    status = "publish",
    type = "post",
    password = "",
    categories = [],
    tags = [],
    terms = [],
    image = false,
    meta = []
  }) {
    let post = this.channel.ele("item");
    post.ele("title", {}, title);
    post.ele("link", {}, url);
    post.ele("pubDate", {}, formatDate(date));
    post.ele("dc:creator").cdata(author);
    post.ele("guid", { isPermaLink: true }, slug);
    post.ele("description").cdata(summary);
    post.ele("content:encoded").cdata(content);
    post.ele("excerpt:encoded").cdata(summary);
    post.ele("wp:post_id", {}, id);
    post.ele("wp:post_date").cdata(formatDate(date));
    post.ele("wp:post_date_gmt").cdata(formatDate(date));
    post.ele("wp:comment_status").cdata(comment_status);
    post.ele("wp:ping_status").cdata(ping_status);
    post.ele("wp:post_name").cdata(slug);
    post.ele("wp:status").cdata(status);
    post.ele("wp:post_parent", {}, 0);
    post.ele("wp:menu_order", {}, 0);
    post.ele("wp:post_type").cdata(type);
    post.ele("wp:post_password").cdata(password);
    post.ele("wp:is_sticky", {}, 0);

    terms
      .concat(categories)
      .concat(tags)
      .forEach(category =>
        post
          .ele("category", {
            domain: category.domain || "category",
            nicename: category.slug
          })
          .cdata(category.name)
      );

    if (image) {
      post.ele({
        "wp:postmeta": [
          {
            "wp:meta_key": "_thumbnail_id",
            "wp:meta_value": image
          }
        ]
      });
    }
    meta.forEach(metaField => {
      post.ele({
        "wp:postmeta": [
          {
            "wp:meta_key": metaField.key,
            "wp:meta_value": metaField.value
          }
        ]
      });
    });
  }

  addPage(page) {
    page.type = "page";
    this.addPost(page);
  }

  /**
   * id: user Id
   * username: user login name
   * email: user email
   * display_name: user nickname
   * first_name: user first name
   * last_name: user last name
   */
  addUser({
    id = rId(),
    username,
    email,
    display_name,
    first_name = "",
    last_name = "",
    meta = []
  }) {
    let user = this.channel.ele("wp:author");
    user.ele("wp:author_id", {}, id);
    user.ele("wp:author_login", {}, username);
    user.ele("wp:author_email", {}, email);
    user.ele("wp:author_display_name", {}, display_name || username);
    user.ele("wp:author_first_name", {}, first_name);
    user.ele("wp:author_last_name", {}, last_name);
    meta.forEach(metaField => {
      user.ele({
        "wp:usermeta": [
          {
            "wp:meta_key": metaField.key,
            "wp:meta_value": metaField.value
          }
        ]
      });
    });
  }

  /**
   * id: tag Id, if not provied, random ID will be generated.
   * slug: tag slug. Used in URLS, e.g. "js-rocks"
   * name: tag title, e.g. "JS"
   * description: tag description string, default is empty.
   */
  addTag({ id = rId(), slug, name, description = "" }) {
    let tag = this.channel.ele("wp:tag");
    tag.ele("wp:term_id", {}, id || Math.floor(Math.random() * 100000));
    tag.ele("wp:tag_slug", {}, slug);
    tag.ele("wp:tag_name", {}, name);
    tag.ele("wp:tag_description", {}, description);
  }

  /**
   * id: category Id. If not provided, random ID will be generated.
   * slug: category slug. Used in URLS, e.g. "js-rocks"
   * name: category title, e.g. "Everything about JS"
   * parent_id: category parent id if it existed.
   * description: category description string, default is empty.
   */
  addCategory({
    id = rId(),
    slug,
    name,
    parent_id = 0,
    description = "",
    termType = "category"
  }) {
    const isCategory = termType === "category";
    let term = this.channel.ele(`wp:${isCategory ? "category" : "term"}`);
    term.ele("wp:term_id", {}, id);
    term
      .ele(`wp:${isCategory ? "category_nicename" : "term_slug"}`)
      .cdata(slug);
    term.ele(`wp:${isCategory ? "cat_name" : "term_name"}`).cdata(name);
    term
      .ele(`wp:${isCategory ? "category_description" : "term_description"}`)
      .cdata(description);
    if (!isCategory) {
      term.ele("wp:term_taxonomy").cdata(termType);
    }
    if (parent_id) {
      term.ele(
        `wp:${isCategory ? "category_parent" : "term_parent"}`,
        {},
        parent_id
      );
    }
  }

  /**
   * id: attachment Id. If not provided, random ID will be generated.
   * url: attachment absolute url.
   * date: attachment create time.
   * file: attachment relative path if it exist.
   * title: attachment title.
   * author: attachment uploader.
   * description: attachment description.
   * post_id: post id relate to the attachment.
   * meta_data: other serialized attach meta data.
   */
  addAttachment({
    id = rId(),
    url,
    date = String(new Date()),
    file,
    title,
    author,
    description = "",
    caption = "",
    post_id,
    comment_status = "closed",
    ping_status = "closed",
    meta_data,
    meta = []
  }) {
    author = author || "admin";
    comment_status = comment_status || "open";
    ping_status = ping_status || "closed";

    let attach = this.channel.ele("item");
    attach.ele("title", {}, title);
    attach.ele("link", {}, url);
    attach.ele("pubDate", {}, formatDate(date));
    attach.ele("dc:creator").cdata(author);
    attach.ele("description").cdata(description);
    attach.ele("content:encoded").cdata(description);
    attach.ele("excerpt:encoded").cdata(caption);
    attach.ele("wp:post_id", {}, id);
    attach.ele("wp:post_date").cdata(formatDate(date));
    attach.ele("wp:comment_status").cdata(comment_status);
    attach.ele("wp:ping_status").cdata(ping_status);
    attach.ele("wp:post_name").cdata(title);
    attach.ele("wp:status").cdata("inherit");
    attach.ele("wp:post_parent", {}, post_id);
    attach.ele("wp:menu_order", {}, 0);
    attach.ele("wp:post_type", {}, "attachment");
    attach.ele("wp:post_password").cdata("");
    attach.ele("wp:is_sticky", {}, 0);
    attach.ele("wp:attachment_url").cdata(url);

    meta.forEach(metaField => {
      attach.ele({
        "wp:postmeta": [
          {
            "wp:meta_key": metaField.key,
            "wp:meta_value": metaField.value
          }
        ]
      });
    });
    if (file) {
      attach.ele({
        "wp:postmeta": [
          {
            "wp:meta_key": "_wp_attached_file",
            "wp:meta_value": file
          }
        ]
      });
    }
    if (meta_data) {
      attach.ele({
        "wp:postmeta": [
          {
            "wp:meta_key": "_wp_attachment_metadata",
            "wp:meta_value": meta_data
          }
        ]
      });
    }
    if (title) {
      attach.ele({
        "wp:postmeta": [
          {
            "wp:meta_key": "_wp_attachment_image_alt",
            "wp:meta_value": title
          }
        ]
      });
    }
  }

  /** TODO */
  addComment() {}

  stringify(config = {}) {
    return this.xml.end({
      pretty: false,
      indent: "    ",
      newline: "\n",
      ...config
    });
  }
};

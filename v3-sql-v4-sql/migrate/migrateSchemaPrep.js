const { dbV4 } = require("../config/database");

async function migrateTables() {
  console.log("DDL: temporary update schema");

  await Promise.all([
    dbV4.raw(
      "alter table components_page_cta_highlights add column subscribe_url varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_instructor_cards add column instructor_id integer"
    ),
    dbV4.raw(
      "alter table components_page_marketo_forms_template add column second_confirm_msg varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_course_sections add column all_courses_url varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_table_of_contents add column visibility boolean"
    ),
    dbV4.raw(
      "alter table components_page_table_of_contents add column visibilty boolean"
    ),
    dbV4.raw(
      "alter table components_podcast_guest_hosts add column biography text"
    ),
    dbV4.raw(
      "alter table components_podcast_guest_hosts add column facebook_profile_slug varchar(255)"
    ),
    dbV4.raw(
      "alter table components_podcast_guest_hosts add column full_name varchar(255)"
    ),
    dbV4.raw(
      "alter table components_podcast_guest_hosts add column linked_in_profile_slug varchar(255)"
    ),
    dbV4.raw(
      "alter table components_podcast_guest_hosts add column twitter_profile_slug varchar(255)"
    ),
    dbV4.raw("alter table components_page_buttons alter column url type text"),
    dbV4.raw(
      "alter table components_page_title_with_authors add column highlight_color varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_page_headers add column bottom_square_color_one varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_page_headers add column bottom_square_color_two varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_quotes add column high_light_color varchar(255)"
    ),
    dbV4.raw("alter table components_page_tracks add column url varchar(255)"),
    dbV4.raw("alter table components_page_faqs add column show_faq boolean"),
    dbV4.raw(
      "alter table components_page_author_biographies add column author_biography text"
    ),
    dbV4.raw(
      "alter table components_page_author_biographies add column author_full_name varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_author_biographies add column biography text"
    ),
    dbV4.raw(
      "alter table components_page_author_biographies add column full_name varchar(255)"
    ),
    dbV4.raw("alter table authors add column first_name varchar(255)"),
    dbV4.raw("alter table authors add column last_name varchar(255)"),
    dbV4.raw("alter table blogs add column content text"),
    dbV4.raw("alter table blogs add column content_menu boolean"),
    dbV4.raw("alter table blogs add column date date"),
    dbV4.raw("alter table blogs add column published_date date"),
    dbV4.raw("alter table blogs add column table_of_contents boolean"),
    dbV4.raw("alter table categories add column blog integer"),
    dbV4.raw("alter table categories add column color varchar(255)"),
    dbV4.raw(
      "alter table components_page_hero_image_globals add column background_color varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_hero_image_globals add column workspace boolean"
    ),
    dbV4.raw(
      "alter table components_page_quote_blocks add column author_bio varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_quote_blocks add column author_full_name varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_quote_blocks add column author_job_title varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_quote_blocks add column color varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_quote_blocks add column use_default_colors boolean"
    ),
    dbV4.raw(
      "alter table components_page_courses_headers add column price_text varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_company_header add column img_height integer"
    ),
    dbV4.raw(
      "alter table components_page_company_header add column img_width integer"
    ),
    dbV4.raw(
      "alter table components_page_feature_highlight add column high_light_color varchar(255)"
    ),
    dbV4.raw(
      "alter table components_page_feature_highlight add column img_height integer"
    ),
    dbV4.raw(
      "alter table components_page_feature_highlight add column img_width integer"
    ),
  ]).catch((err) => {
    console.log(err);
  });

  console.log("DDL: temporary update schema complete");
}

const migrateSchemaPrep = {
  processedTables: [],
  migrateTables,
};

module.exports = { migrateSchemaPrep };

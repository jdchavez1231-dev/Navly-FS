-- Fix status values to match UI and add unique constraint for upserts
alter table checklists drop constraint if exists checklists_status_check;
alter table checklists alter column status set default 'not_assessed';
alter table checklists add constraint checklists_status_check
  check (status in ('not_assessed', 'compliant', 'gap', 'na'));

-- Unique constraint so we can upsert by facility + standard + element_code
alter table checklists drop constraint if exists checklists_facility_standard_element_key;
alter table checklists add constraint checklists_facility_standard_element_key
  unique (facility_id, standard, element_code);

begin;
select plan(5);

select has_schema('api');
select has_schema('private');
select ok(has_schema_privilege('authenticated', 'api', 'usage'), 'signed-in users can use api');
select ok(not has_schema_privilege('anon', 'api', 'usage'), 'signed-out visitors cannot use api');
select ok(not has_schema_privilege('authenticated', 'private', 'usage'), 'signed-in users cannot use private');

select * from finish();
rollback;

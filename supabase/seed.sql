-- Initial content. Run after the migration.
-- Safe to re-run: it only inserts rows that are missing.

-- Owner: create your user first (Authentication > Users > Add user), then this
-- links it. Change the email if you log in with a different one.
insert into private.owner (user_id)
select id from auth.users where email = 'carreon21diego@gmail.com'
on conflict do nothing;

insert into public.profile (id, name, headline, bio, availability, focus, right_now, email, github, linkedin)
values (
  true,
  'Diego Carreón',
  'Frontend developer and UI/UX designer',
  'Computer Science student at Tec de Monterrey, on exchange at Uppsala University this semester. I design and build interfaces that are clear, accessible and secure by default.',
  'Open to Summer 2027 internships',
  'Frontend or product engineering · Europe or Mexico',
  '[
    {"title": "Building The Nook''s beta", "detail": "Testing the map and check-in flow with students in Mexico City."},
    {"title": "Exchange semester in Uppsala", "detail": "Coursework in human–computer interaction and web security."},
    {"title": "Writing these case studies", "detail": "Documenting my role, process and decisions for each project."}
  ]'::jsonb,
  'carreon21diego@gmail.com',
  'github.com/A01747352',
  'linkedin.com/in/dcarreonag'
)
on conflict (id) do nothing;

insert into public.projects (slug, name, summary, role, year, tools, tagline, award, featured, published, sort_order, case_study_md)
values
(
  'the-nook', 'The Nook',
  'A community app for finding quiet places to study in Mexico City.',
  'Design and development', '2026', array['React Native', 'TypeScript', 'Figma'],
  'Quiet places to study, CDMX', null, true, true, 1,
  $md$## Problem

Students in Mexico City lose time looking for somewhere quiet to work. Cafés get loud, libraries fill up, and there is no shared, current record of which places are actually calm and at what hours.

## Process

I interviewed classmates about where they study and why they leave, then mapped the decision they make in the first minute. In Figma I prototyped a map with noise and seating signals reported by the community, and built it in React Native with TypeScript.

## Result

A working beta that lets students find, rate and check in to quiet spots. Placeholder: add numbers from testing and the next decisions here.
$md$
),
(
  'beneficio-joven', 'Beneficio Joven',
  'A mobile app for the municipality of Atizapán de Zaragoza that helps young people access local benefits.',
  'Team project', '2025', '{}',
  null, null, false, true, 2,
  $md$## Problem

Young residents of Atizapán de Zaragoza were not using local benefits because the information was scattered and hard to act on.

## Process

Placeholder: describe the team, your part of the work and the main design decisions.

## Result

Placeholder: describe what was delivered to the municipality.
$md$
),
(
  'cryptopia', 'Cryptopia',
  'A multiplayer educational video game built in C#.',
  'Team project', '2024', array['C#'],
  null, 'Best Project award', false, true, 3,
  $md$## Problem

Placeholder: what the game teaches and who it is for.

## Process

Placeholder: how the multiplayer and learning loops were designed and built in C#.

## Result

Cryptopia won the Best Project award in 2024.
$md$
)
on conflict (slug) do nothing;

insert into public.path_entries (kind, title, place, years, sort_order)
select v.kind::public.path_kind, v.title, v.place, v.years, v.sort_order
from (values
  ('education', 'Exchange semester', 'Uppsala University, Sweden', '2026', 1),
  ('education', 'B.S. Computer Science and Engineering', 'Tecnológico de Monterrey, Mexico', '2023–2027', 2),
  ('award', 'Best Project award, Cryptopia', 'Tecnológico de Monterrey', '2024', 3),
  ('language', 'German', 'ISL Sprachschule', '2022–2023', 4)
) as v (kind, title, place, years, sort_order)
where not exists (select 1 from public.path_entries);

-- Job-search plan (private; only visible in the panel).
do $$
declare
  new_phase_id uuid;
  phase record;
  task text;
  i integer;
begin
  if exists (select 1 from public.plan_phases) then
    return;
  end if;

  for phase in
    select * from (values
      (1, 'Semana 1 (20–26 oct): perfiles',
          array['Actualizar LinkedIn en inglés', 'README de perfil en GitHub', 'Foto de perfil para el sitio', 'Bio de 2–3 frases'], 2),
      (2, 'Semana 2 (27 oct–2 nov): contenido',
          array['Case study de The Nook', 'Capturas de The Nook', 'Case study de Beneficio Joven', 'Case study de Cryptopia'], 0),
      (3, 'Semana 3 (3–9 nov): publicar',
          array['Comprar dominio', 'Publicar el sitio', 'Pedir feedback a 3 personas'], 0),
      (4, 'Semana 4 (10–16 nov): postular',
          array['Lista de 20 empresas en Europa y México', 'Postular a 10 internships'], 0)
    ) as p (sort_order, name, tasks, done_count)
  loop
    insert into public.plan_phases (name, sort_order)
    values (phase.name, phase.sort_order)
    returning id into new_phase_id;

    i := 0;
    foreach task in array phase.tasks loop
      i := i + 1;
      insert into public.plan_tasks (phase_id, text, done, sort_order)
      values (new_phase_id, task, i <= phase.done_count, i);
    end loop;
  end loop;
end;
$$;

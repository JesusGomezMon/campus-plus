-- =====================================================================
-- Campus+ · Esquema de base de datos (PostgreSQL / Supabase)
-- Ejecutar completo en: Supabase → SQL Editor → New query → Run
-- =====================================================================

-- ---------- Tipos ----------
create type public.rol as enum ('estudiante', 'profesor', 'tutor');
create type public.estado as enum ('Pendiente', 'En proceso', 'Terminada');

-- ---------- Tablas ----------

-- Perfil de cada usuario autenticado (1 a 1 con auth.users).
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null check (char_length(btrim(nombre)) between 2 and 120),
  rol         public.rol not null,
  matricula   text unique check (matricula ~ '^[0-9]{5,10}$'),
  programa    text check (char_length(programa) <= 120),
  tutor_id    uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  -- Solo los estudiantes tienen matrícula, programa y tutor.
  constraint datos_de_estudiante check (
    rol = 'estudiante' or (matricula is null and tutor_id is null)
  )
);

-- Actividad registrada por un profesor.
create table public.actividades (
  id           bigint generated always as identity primary key,
  titulo       text not null check (char_length(btrim(titulo)) between 1 and 120),
  descripcion  text not null default '' check (char_length(descripcion) <= 2000),
  materia      text not null default 'General' check (char_length(btrim(materia)) between 1 and 80),
  fecha        date not null,
  hora         time,
  para_grupo   boolean not null default false,
  profesor_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Asignación de una actividad a un estudiante, con el avance propio de ese estudiante.
create table public.asignaciones (
  actividad_id   bigint not null references public.actividades (id) on delete cascade,
  estudiante_id  uuid   not null references public.profiles (id) on delete cascade,
  estado         public.estado not null default 'Pendiente',
  actualizado    timestamptz not null default now(),
  primary key (actividad_id, estudiante_id)
);

-- Bitácora de auditoría: quién cambió qué y cuándo.
create table public.bitacora (
  id           bigint generated always as identity primary key,
  tabla        text not null,
  operacion    text not null,
  registro     text not null,
  usuario_id   uuid default auth.uid(),
  fecha        timestamptz not null default now(),
  antes        jsonb,
  despues      jsonb
);

-- ---------- Índices (consultas más frecuentes) ----------
create index actividades_profesor_fecha_idx on public.actividades (profesor_id, fecha);
create index asignaciones_estudiante_idx   on public.asignaciones (estudiante_id);
create index profiles_tutor_idx            on public.profiles (tutor_id);
create index profiles_rol_idx              on public.profiles (rol);

-- ---------- Funciones auxiliares (SECURITY DEFINER evita recursión en RLS) ----------
create or replace function public.mi_rol() returns public.rol
language sql stable security definer set search_path = public as $$
  select rol from public.profiles where id = auth.uid()
$$;

create or replace function public.es_mi_tutorado(p_estudiante uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = p_estudiante and tutor_id = auth.uid())
$$;

create or replace function public.es_mi_actividad(p_actividad bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.actividades where id = p_actividad and profesor_id = auth.uid())
$$;

create or replace function public.puedo_ver_actividad(p_actividad bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.asignaciones s
    left join public.profiles p on p.id = s.estudiante_id
    where s.actividad_id = p_actividad
      and (s.estudiante_id = auth.uid() or p.tutor_id = auth.uid())
  )
$$;

-- ---------- Disparadores ----------
create or replace function public.tocar_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger actividades_updated_at before update on public.actividades
  for each row execute function public.tocar_updated_at();

create or replace function public.tocar_actualizado() returns trigger
language plpgsql as $$
begin
  new.actualizado := now();
  return new;
end $$;

create trigger asignaciones_actualizado before update on public.asignaciones
  for each row execute function public.tocar_actualizado();

create or replace function public.registrar_bitacora() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_registro text;
begin
  if tg_table_name = 'asignaciones' then
    v_registro := coalesce(new.actividad_id, old.actividad_id)::text || ':' || coalesce(new.estudiante_id, old.estudiante_id)::text;
  else
    v_registro := coalesce(new.id, old.id)::text;
  end if;
  insert into public.bitacora (tabla, operacion, registro, antes, despues)
  values (
    tg_table_name, tg_op, v_registro,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create trigger actividades_bitacora after insert or update or delete on public.actividades
  for each row execute function public.registrar_bitacora();
create trigger asignaciones_bitacora after insert or update or delete on public.asignaciones
  for each row execute function public.registrar_bitacora();

-- ---------- Seguridad a nivel de fila (RLS) ----------
alter table public.profiles     enable row level security;
alter table public.actividades  enable row level security;
alter table public.asignaciones enable row level security;
alter table public.bitacora     enable row level security;

-- Perfiles: cada quien ve el suyo; todos ven a los profesores (nombre en actividades);
-- el profesor ve a los estudiantes; el tutor ve a sus tutorados. Nadie edita desde la app.
create policy perfiles_lectura on public.profiles for select to authenticated using (
  id = auth.uid()
  or rol = 'profesor'
  or (rol = 'estudiante' and public.mi_rol() = 'profesor')
  or tutor_id = auth.uid()
);

-- Actividades
create policy actividades_lectura on public.actividades for select to authenticated using (
  profesor_id = auth.uid() or public.puedo_ver_actividad(id)
);
create policy actividades_alta on public.actividades for insert to authenticated with check (
  profesor_id = auth.uid() and public.mi_rol() = 'profesor'
);
create policy actividades_edicion on public.actividades for update to authenticated
  using (profesor_id = auth.uid()) with check (profesor_id = auth.uid());
create policy actividades_baja on public.actividades for delete to authenticated using (
  profesor_id = auth.uid()
);

-- Asignaciones
create policy asignaciones_lectura on public.asignaciones for select to authenticated using (
  estudiante_id = auth.uid()
  or public.es_mi_tutorado(estudiante_id)
  or public.es_mi_actividad(actividad_id)
);
create policy asignaciones_alta on public.asignaciones for insert to authenticated with check (
  public.es_mi_actividad(actividad_id)
);
create policy asignaciones_baja on public.asignaciones for delete to authenticated using (
  public.es_mi_actividad(actividad_id)
);
-- Solo el estudiante dueño cambia su estado.
create policy asignaciones_estado on public.asignaciones for update to authenticated
  using (estudiante_id = auth.uid()) with check (estudiante_id = auth.uid());

-- Bitácora: sin políticas → inaccesible desde la app (solo administradores).

-- ---------- Privilegios por columna ----------
revoke all on public.profiles, public.actividades, public.asignaciones, public.bitacora from anon;
revoke update on public.actividades, public.asignaciones from authenticated;
grant select on public.profiles to authenticated;
grant select, insert, delete on public.actividades, public.asignaciones to authenticated;
-- El profesor no puede reasignar la autoría; el estudiante solo puede tocar "estado".
grant update (titulo, descripcion, materia, fecha, hora, para_grupo) on public.actividades to authenticated;
grant update (estado) on public.asignaciones to authenticated;

-- ---------- Operación transaccional: guardar actividad + asignaciones ----------
-- p_id = null crea; p_estudiante = null asigna al grupo completo (todos los estudiantes).
create or replace function public.guardar_actividad(
  p_id bigint,
  p_titulo text,
  p_descripcion text,
  p_materia text,
  p_fecha date,
  p_hora time,
  p_estudiante uuid
) returns bigint
language plpgsql security invoker set search_path = public as $$
declare
  v_id bigint;
begin
  if public.mi_rol() is distinct from 'profesor' then
    raise exception 'Solo un profesor puede registrar actividades' using errcode = '42501';
  end if;

  if p_id is null then
    insert into actividades (titulo, descripcion, materia, fecha, hora, para_grupo)
    values (btrim(p_titulo), coalesce(p_descripcion, ''), coalesce(nullif(btrim(p_materia), ''), 'General'), p_fecha, p_hora, p_estudiante is null)
    returning id into v_id;
  else
    update actividades
       set titulo = btrim(p_titulo),
           descripcion = coalesce(p_descripcion, ''),
           materia = coalesce(nullif(btrim(p_materia), ''), 'General'),
           fecha = p_fecha,
           hora = p_hora,
           para_grupo = p_estudiante is null
     where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'Actividad no encontrada' using errcode = 'P0002';
    end if;
    -- Quita a quienes ya no son destinatarios (conserva el avance de los que siguen).
    delete from asignaciones
     where actividad_id = v_id
       and (p_estudiante is not null and estudiante_id <> p_estudiante);
  end if;

  if p_estudiante is null then
    insert into asignaciones (actividad_id, estudiante_id)
    select v_id, p.id from profiles p where p.rol = 'estudiante'
    on conflict do nothing;
  else
    if not exists (select 1 from profiles where id = p_estudiante and rol = 'estudiante') then
      raise exception 'El destinatario no es un estudiante' using errcode = '22023';
    end if;
    insert into asignaciones (actividad_id, estudiante_id)
    values (v_id, p_estudiante)
    on conflict do nothing;
  end if;

  return v_id;
end $$;

revoke execute on function public.guardar_actividad from anon, public;
grant execute on function public.guardar_actividad to authenticated;

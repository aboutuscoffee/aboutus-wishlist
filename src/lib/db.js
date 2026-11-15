import { supabase } from './supabase.js';

const T = 'wl_items';

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchItems() {
  return check(await supabase.from(T).select('*').order('created_at', { ascending: false }));
}

export async function createItem(fields) {
  return check(await supabase.from(T).insert(fields).select().single());
}

export async function updateItem(id, fields) {
  return check(
    await supabase.from(T).update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  );
}

export async function deleteItem(id) {
  check(await supabase.from(T).delete().eq('id', id));
}

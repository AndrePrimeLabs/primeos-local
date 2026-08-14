import { supabase as defaultSupabase } from '@/lib/supabase';

function parseOrderBy(orderBy) {
  if (!orderBy || typeof orderBy !== 'string') return null;
  const ascending = !orderBy.startsWith('-');
  const field = orderBy.startsWith('-') ? orderBy.slice(1) : orderBy;
  return { field, ascending };
}

function applyOrder(query, orderBy) {
  const order = parseOrderBy(orderBy);
  if (!order) return query;
  return query.order(order.field, { ascending: order.ascending });
}

/**
 * @param {string} tableName Postgres table name
 * @param {import('@supabase/supabase-js').SupabaseClient} [client]
 */
export function createEntity(tableName, client = defaultSupabase) {
  return {
    async list(orderBy, limit) {
      let query = client.from(tableName).select('*');
      query = applyOrder(query, orderBy);
      if (typeof limit === 'number') {
        query = query.limit(limit);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async filter(filters = {}, orderBy, limit) {
      let query = client.from(tableName).select('*');
      Object.entries(filters || {}).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(field, value);
        }
      });
      query = applyOrder(query, orderBy);
      if (typeof limit === 'number') {
        query = query.limit(limit);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(payload) {
      const now = new Date().toISOString();
      const { data, error } = await client
        .from(tableName)
        .insert([{
          ...payload,
          created_date: payload.created_date ?? now,
          updated_date: payload.updated_date ?? now,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      const { data, error } = await client
        .from(tableName)
        .update({ ...payload, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await client.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },

    subscribe(callback) {
      const channel = client
        .channel(`realtime:${tableName}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload) => {
            callback({
              type: payload.eventType,
              record: payload.new ?? payload.old,
            });
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    },
  };
}

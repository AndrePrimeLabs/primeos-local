// @ts-nocheck
import { supabase } from '@/lib/supabase';

export function createEntity(tableName) {
  return {
    async list(options = {}) {
      let query = supabase.from(tableName).select('*');
      if (options.filters) {
        options.filters.forEach(({ field, operator, value }) => {
          query = query.filter(field, operator || 'eq', value);
        });
      }
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? false });
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(payload) {
      const { data, error } = await supabase
        .from(tableName)
        .insert([{ ...payload, created_date: new Date().toISOString(), updated_date: new Date().toISOString() }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(tableName)
        .update({ ...payload, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },

    async filter(field, value) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(field, value);
      if (error) throw error;
      return data || [];
    }
  };
}

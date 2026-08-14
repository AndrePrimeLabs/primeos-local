/**
 * Example usage of the Base44 to Supabase SDK
 * 
 * This example shows how your existing Base44 code works unchanged
 * with the universal custom SDK.
 */

// Import your existing entities - no changes needed!
import { base44 } from './src/api/base44Client.js'

// Your existing Base44 code works exactly the same
async function exampleUsage() {
  try {
    // Authentication - works identically to Base44
    const user = await base44.auth.me()
    console.log('Current user:', user)

    // Entity operations - automatically discovered and created
    const BlogPost = base44.entities.BlogPost        // → blog_posts table
    const Product = base44.entities.Product          // → products table  
    const UserMembership = base44.entities.UserMembership // → user_memberships table

    // All CRUD operations work unchanged
    const posts = await BlogPost.list('-created_date')
    console.log('Latest blog posts:', posts)

    const products = await Product.filter({ status: 'active' })
    console.log('Active products:', products)

    // Create new records - same API
    const newPost = await BlogPost.create({
      title: 'My New Post',
      content: 'This is the content',
      status: 'published'
    })
    console.log('Created post:', newPost)

    // Update records - same API
    const updatedPost = await BlogPost.update(newPost.id, {
      title: 'Updated Title'
    })
    console.log('Updated post:', updatedPost)

    // Custom entities work automatically
    const YourCustomEntity = base44.entities.YourCustomEntity
    const customData = await YourCustomEntity.list()
    console.log('Custom entity data:', customData)

    // Integration functions (placeholders - implement as needed)
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: 'Generate a blog post title about Base44 migration',
      response_json_schema: { type: 'object', properties: { title: { type: 'string' } } }
    })
    console.log('LLM Response:', llmResponse)

    const emailResult = await base44.integrations.Core.SendEmail({
      to: 'user@example.com',
      subject: 'Welcome to our migrated app!',
      body: '<h1>Migration successful!</h1><p>Your app is now self-hosted.</p>'
    })
    console.log('Email sent:', emailResult)

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the example
exampleUsage()

/**
 * Key Benefits Demonstrated:
 * 
 * 1. Zero Code Changes: All your existing Base44 code works unchanged
 * 2. Universal Compatibility: Any entity name automatically works
 * 3. Smart Discovery: Entities are created on-demand with proper naming
 * 4. Intelligent Security: Service role applied automatically for sensitive entities
 * 5. Full API Compatibility: All Base44 methods work identically
 * 
 * Migration Steps:
 * 1. Copy the SDK files to your project
 * 2. Set up Supabase project and environment variables
 * 3. Create database schema matching your Base44 entities
 * 4. That's it! Your code works unchanged.
 */
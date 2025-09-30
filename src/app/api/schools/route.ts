import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { saveUploadedFile, validateFileType, validateFileSize } from '@/lib/fileUpload';
import { verifyToken } from '@/lib/auth';
import { School } from '@/types/school';

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT 
        s.*,
        u.email as created_by_email
      FROM schools s
      LEFT JOIN app_users u ON s.created_by = u.id
      ORDER BY s.created_at DESC
    `);
    client.release();

    return NextResponse.json({
      success: true,
      data: result.rows as School[]
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let userId: number;
    try {
      const payload = await verifyToken(token);
      userId = payload.userId;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const contact = formData.get('contact') as string;
    const email_id = formData.get('email_id') as string;
    const imageFile = formData.get('image') as File;

    if (!name || !address || !city || !state || !contact || !email_id) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const contactNumber = parseInt(contact);
    if (isNaN(contactNumber) || contactNumber <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid contact number' },
        { status: 400 }
      );
    }

    let imagePath = null;

    if (imageFile && imageFile.size > 0) {
      if (!validateFileType(imageFile)) {
        return NextResponse.json(
          { success: false, error: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.' },
          { status: 400 }
        );
      }

      if (!validateFileSize(imageFile, 5)) {
        return NextResponse.json(
          { success: false, error: 'File size too large. Maximum 5MB allowed.' },
          { status: 400 }
        );
      }

      try {
        imagePath = await saveUploadedFile(imageFile);
      } catch (error) {
        console.error('Error saving file:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to save image' },
          { status: 500 }
        );
      }
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO schools (name, address, city, state, contact, email_id, image, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [name, address, city, state, contactNumber, email_id, imagePath, userId]
      );
      
      client.release();

      return NextResponse.json({
        success: true,
        message: 'School added successfully',
        data: result.rows[0] as School
      });
    } catch (dbError) {
      client.release();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to save school to database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/schools:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

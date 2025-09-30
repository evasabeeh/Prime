import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const schoolId = parseInt(id);
    if (isNaN(schoolId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid school ID' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const contact = formData.get('contact') as string;
    const email_id = formData.get('email_id') as string;

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

    const client = await pool.connect();
    
    try {
      const checkResult = await client.query(
        'SELECT id, created_by FROM schools WHERE id = $1',
        [schoolId]
      );

      if (checkResult.rows.length === 0) {
        client.release();
        return NextResponse.json(
          { success: false, error: 'School not found' },
          { status: 404 }
        );
      }

      const school = checkResult.rows[0];
      if (school.created_by !== userId) {
        client.release();
        return NextResponse.json(
          { success: false, error: 'You can only edit schools you created' },
          { status: 403 }
        );
      }

      const updateResult = await client.query(
        'UPDATE schools SET name = $1, address = $2, city = $3, state = $4, contact = $5, email_id = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
        [name, address, city, state, contactNumber, email_id, schoolId]
      );

      client.release();

      if (updateResult.rowCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Failed to update school' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'School updated successfully',
        data: updateResult.rows[0]
      });

    } catch (dbError) {
      client.release();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to update school' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in PUT /api/schools/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schoolId = parseInt(id);
    if (isNaN(schoolId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid school ID' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    const result = await client.query(
      `SELECT 
        s.*,
        u.email as created_by_email
      FROM schools s
      LEFT JOIN app_users u ON s.created_by = u.id
      WHERE s.id = $1`,
      [schoolId]
    );
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch school' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const schoolId = parseInt(id);
    if (isNaN(schoolId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid school ID' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      const checkResult = await client.query(
        'SELECT id, created_by FROM schools WHERE id = $1',
        [schoolId]
      );

      if (checkResult.rows.length === 0) {
        client.release();
        return NextResponse.json(
          { success: false, error: 'School not found' },
          { status: 404 }
        );
      }

      const school = checkResult.rows[0];
      if (school.created_by !== userId) {
        client.release();
        return NextResponse.json(
          { success: false, error: 'You can only delete schools you created' },
          { status: 403 }
        );
      }

      const deleteResult = await client.query(
        'DELETE FROM schools WHERE id = $1',
        [schoolId]
      );

      client.release();

      if (deleteResult.rowCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Failed to delete school' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'School deleted successfully'
      });

    } catch (dbError) {
      client.release();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete school' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in DELETE /api/schools/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}